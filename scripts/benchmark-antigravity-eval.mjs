#!/usr/bin/env node

/**
 * Tier 2 Benchmark: Antigravity Routing, 2-Hop Retrieval & Sandbox Guardrail Eval
 *
 * Modes:
 *   --mode static  (default, 0 API tokens) — Verifies structural 2-hop reachability,
 *                  subagent sandbox flags, Mandatory Router Skill Protocol injection,
 *                  and live execution of Antigravity pre-tool-guard.mjs across all 21 cases.
 *   --mode live    Runs selected cases through `agy -p --output-format stream-json`
 *                  and measures real routing, 2-hop file reads, latency, and token metrics.
 *
 * Usage:
 *   node scripts/benchmark-antigravity-eval.mjs [--mode static|live] [--squad <key>] [--id <id>] [--limit <n>] [--model <m>] [--effort low|medium|high]
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const EVAL_SET_PATH = join(ROOT, 'scripts', 'benchmarks', 'golden-eval-set.json');
const GUARD_SCRIPT = join(ROOT, 'plugins', 'saas-kit-core', 'hooks', 'pre-tool-guard.mjs');

function parseArgs(argv) {
  const opts = {
    mode: 'static',
    squad: null,
    id: null,
    limit: null,
    model: null,
    effort: 'low',
    timeout: '2m',
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--mode' && argv[i + 1]) opts.mode = argv[++i];
    else if (argv[i] === '--squad' && argv[i + 1]) opts.squad = argv[++i];
    else if (argv[i] === '--id' && argv[i + 1]) opts.id = argv[++i];
    else if (argv[i] === '--limit' && argv[i + 1]) opts.limit = Number(argv[++i]);
    else if (argv[i] === '--model' && argv[i + 1]) opts.model = argv[++i];
    else if (argv[i] === '--effort' && argv[i + 1]) opts.effort = argv[++i];
    else if (argv[i] === '--timeout' && argv[i + 1]) opts.timeout = argv[++i];
  }
  return opts;
}

function walkFiles(dir, result = []) {
  if (!existsSync(dir)) return result;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, result);
    else result.push(full);
  }
  return result;
}

function runStaticCase(tc) {
  const pluginDir = join(ROOT, 'plugins', tc.pluginId);
  const subagentPath = join(pluginDir, 'subagents', `${tc.expectedExpert}.json`);
  const checks = [];

  if (!existsSync(subagentPath)) {
    return { id: tc.id, squad: tc.squad, category: tc.category, passed: false, details: `Missing subagent ${subagentPath}` };
  }
  const sub = JSON.parse(readFileSync(subagentPath, 'utf8'));

  if (tc.category === 'guardrail-sandbox') {
    if (tc.hookPayload) {
      const res = spawnSync('node', [GUARD_SCRIPT, '--harness', 'antigravity'], {
        input: JSON.stringify(tc.hookPayload),
        encoding: 'utf8',
      });
      let decision = 'parse-error';
      try {
        decision = JSON.parse(res.stdout.trim()).decision;
      } catch {
        // leave parse-error
      }
      const ok = res.status === 0 && decision === 'deny';
      checks.push(`pre-tool-guard=${decision}`);
      return { id: tc.id, squad: tc.squad, category: tc.category, passed: ok, details: checks.join(', ') };
    }
    if (tc.expectedBehavior === 'enforce-readonly-subagent') {
      const ok = sub.enableWriteTools === false && sub.enableSubagentTools === false;
      checks.push(`enableWriteTools=${sub.enableWriteTools}`);
      checks.push(`enableSubagentTools=${sub.enableSubagentTools}`);
      return { id: tc.id, squad: tc.squad, category: tc.category, passed: ok, details: checks.join(', ') };
    }
  }

  // Domain routing + 2-hop structural reachability
  const hasProtocol = typeof sub.systemPrompt === 'string' && sub.systemPrompt.includes('Mandatory Router Skill Protocol');
  checks.push(`2-hop-protocol=${hasProtocol ? 'ok' : 'MISSING'}`);

  const routerSkillPath = join(pluginDir, 'skills', tc.expectedRouterSkill, 'SKILL.md');
  const hasRouter = existsSync(routerSkillPath);
  checks.push(`router=${hasRouter ? tc.expectedRouterSkill : 'MISSING'}`);

  let refsFound = 0;
  let refsLinked = 0;
  if (hasRouter) {
    const routerContent = readFileSync(routerSkillPath, 'utf8');
    for (const refFile of tc.expectedReferenceAny || []) {
      const refPath = join(pluginDir, 'skills', tc.expectedRouterSkill, 'references', refFile);
      if (existsSync(refPath) && readFileSync(refPath, 'utf8').trim().length > 100) refsFound += 1;
      if (routerContent.includes(`references/${refFile}`)) refsLinked += 1;
    }
  }
  checks.push(`refs=${refsFound}/${(tc.expectedReferenceAny || []).length} (linked:${refsLinked})`);

  let scriptOk = true;
  if (tc.expectedScriptAny && tc.expectedScriptAny.length > 0) {
    const scriptsDir = join(pluginDir, 'skills', tc.expectedRouterSkill, 'scripts');
    const allScripts = walkFiles(scriptsDir).map((p) => p.split('/').pop());
    scriptOk = tc.expectedScriptAny.some((s) => allScripts.includes(s));
    checks.push(`scripts=${scriptOk ? 'ok' : 'MISSING'}`);
  }

  const dagOk = tc.expectedExpert === 'tech-lead' ? sub.enableSubagentTools === true : sub.enableSubagentTools === false;
  checks.push(`dag=${dagOk ? 'ok' : 'VIOLATION'}`);

  const passed = hasProtocol && hasRouter && refsFound > 0 && refsLinked > 0 && scriptOk && dagOk;
  return { id: tc.id, squad: tc.squad, category: tc.category, passed, details: checks.join(', ') };
}

function extractTokenUsage(events) {
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let found = false;

  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (typeof node.input_tokens === 'number' || typeof node.inputTokens === 'number') {
      inputTokens += node.input_tokens ?? node.inputTokens ?? 0;
      outputTokens += node.output_tokens ?? node.outputTokens ?? 0;
      cacheReadTokens += node.cache_read_input_tokens ?? node.cacheReadInputTokens ?? node.cached_tokens ?? 0;
      found = true;
      return;
    }
    for (const val of Object.values(node)) {
      if (val && typeof val === 'object') visit(val);
    }
  };

  for (const ev of events) visit(ev);
  return found ? { inputTokens, outputTokens, cacheReadTokens } : null;
}

function runLiveCase(tc, opts) {
  const start = Date.now();
  const prompt = [
    `[Eval ${tc.id}] Inspect our installed SaaS Kit plugins under plugins/ (read-only analysis, do NOT modify repo files).`,
    `Task: ${tc.prompt}`,
    `Requirements:`,
    `1. Do NOT ask clarifying questions; answer directly in one pass.`,
    `2. Identify the exact Senior Expert from .agent-core/roster.json.`,
    `3. Follow the Mandatory Router Skill Protocol: read the relevant plugins/${tc.pluginId}/skills/${tc.expectedRouterSkill || 'core-engineering'}/SKILL.md and open at least one relevant references/*.md file before answering.`,
    `4. Give a concise technical answer grounded in that reference (or refuse if it violates security/sandbox rules).`,
  ].join('\n');

  const args = [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    '--mode',
    'plan',
    '--effort',
    opts.effort,
    '--print-timeout',
    opts.timeout,
  ];
  if (opts.model) args.push('--model', opts.model);

  const res = spawnSync('agy', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });

  const durationMs = Date.now() - start;
  const rawLines = (res.stdout || '').split('\n').filter(Boolean);
  let textBlob = '';
  const readPaths = [];
  const parsedEvents = [];

  for (const line of rawLines) {
    try {
      const ev = JSON.parse(line);
      parsedEvents.push(ev);
      const serialized = JSON.stringify(ev);
      if (serialized.includes('references/')) {
        const matches = serialized.match(/references\/[a-zA-Z0-9._-]+\.md/g) || [];
        readPaths.push(...matches);
      }
      if (typeof ev.text === 'string') textBlob += ev.text + '\n';
      if (typeof ev.result === 'string') textBlob += ev.result + '\n';
      if (typeof ev.content === 'string') textBlob += ev.content + '\n';
      if (ev.message && typeof ev.message.content === 'string') textBlob += ev.message.content + '\n';
    } catch {
      textBlob += line + '\n';
    }
  }

  const tokenUsage = extractTokenUsage(parsedEvents);
  const refsRead = [...new Set(readPaths)];
  const fullText = `${textBlob}\n${res.stdout || ''}`;
  const routedExpert = fullText.toLowerCase().includes(tc.expectedExpert.toLowerCase());
  let hop2Ok = true;
  if (tc.category === 'domain-routing-2hop') {
    const expectedRefs = tc.expectedReferenceAny || [];
    hop2Ok = expectedRefs.some((r) => refsRead.includes(`references/${r}`) || fullText.includes(r));
  } else {
    hop2Ok = /deny|block|refus|cannot|read-only|forbidden|prohibit|not allowed|không được/i.test(fullText);
  }

  const rawPreviewSource = textBlob.trim() || (res.stdout || '').trim() || (res.stderr || '').trim();
  const responsePreview = rawPreviewSource.slice(-600);
  const tokLabel = tokenUsage
    ? `, tok=${tokenUsage.inputTokens}in/${tokenUsage.outputTokens}out`
    : '';

  const passed = res.status === 0 && routedExpert && hop2Ok;
  return {
    id: tc.id,
    squad: tc.squad,
    category: tc.category,
    passed,
    durationMs,
    refsRead,
    tokenUsage,
    responsePreview,
    details: `exit=${res.status}, expert=${routedExpert ? 'ok' : 'miss'}, 2-hop/guard=${hop2Ok ? 'ok' : 'miss'}, refs_seen=${refsRead.length}${tokLabel}, ${(durationMs / 1000).toFixed(1)}s`,
  };
}

const opts = parseArgs(process.argv.slice(2));
const evalSet = JSON.parse(readFileSync(EVAL_SET_PATH, 'utf8'));
let cases = evalSet.cases;

if (opts.squad) cases = cases.filter((c) => c.squad === opts.squad);
if (opts.id) cases = cases.filter((c) => c.id === opts.id);
if (opts.limit && opts.limit > 0) cases = cases.slice(0, opts.limit);

if (opts.mode === 'live') {
  try {
    execFileSync('which', ['agy'], { stdio: 'ignore' });
  } catch {
    console.error('Error: `agy` CLI not found in PATH. Install Antigravity CLI or run `--mode static`.');
    process.exit(1);
  }
}

const results = cases.map((tc) => (opts.mode === 'live' ? runLiveCase(tc, opts) : runStaticCase(tc)));
const passed = results.filter((r) => r.passed).length;
const total = results.length;

console.log(`# Antigravity Tier 2 Eval (${opts.mode.toUpperCase()} mode): ${passed}/${total} PASSED\n`);
console.log('| Case ID | Squad | Category | Status | Details |');
console.log('|---|---|---|---|---|');
for (const r of results) {
  console.log(`| \`${r.id}\` | \`${r.squad}\` | ${r.category} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.details} |`);
}

if (opts.mode === 'live') {
  const outDir = join(ROOT, '_workspace', 'benchmarks');
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = join(outDir, `antigravity-eval-${stamp}.json`);
  writeFileSync(outFile, JSON.stringify({ mode: opts.mode, passed, total, results }, null, 2), 'utf8');
  console.log(`\nSaved raw live eval trace to ${outFile}`);
}

process.exit(passed === total ? 0 : 1);
