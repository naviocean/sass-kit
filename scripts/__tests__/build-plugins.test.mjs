#!/usr/bin/env node

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const BUILD_SCRIPT = join(ROOT, 'scripts', 'build-plugins.mjs');
const PLUGINS_DIR = join(ROOT, 'plugins');

test('build-plugins: compiles all 9 squad plugins and both marketplace manifests', () => {
  execFileSync(process.execPath, [BUILD_SCRIPT, '--clean'], { cwd: ROOT, encoding: 'utf8' });

  const expectedPlugins = [
    'saas-kit-core',
    'saas-kit-web-frontend',
    'saas-kit-nestjs-backend',
    'saas-kit-python-ai',
    'saas-kit-rust-systems',
    'saas-kit-mobile-native',
    'saas-kit-swift-macos',
    'saas-kit-devops-infra',
    'saas-kit-document-office',
  ];

  for (const id of expectedPlugins) {
    const dir = join(PLUGINS_DIR, id);
    assert.ok(existsSync(dir), `Missing plugin directory: ${id}`);
    assert.ok(existsSync(join(dir, '.claude-plugin', 'plugin.json')), `Missing Claude manifest in ${id}`);
    assert.ok(existsSync(join(dir, '.codex-plugin', 'plugin.json')), `Missing Codex manifest in ${id}`);
    assert.ok(existsSync(join(dir, 'plugin.json')), `Missing Antigravity manifest in ${id}`);
    assert.ok(existsSync(join(dir, 'package.json')), `Missing OpenCode package.json in ${id}`);
    assert.ok(existsSync(join(dir, 'rules', 'AGENTS.md')), `Missing Antigravity rules/AGENTS.md in ${id}`);

    const agyManifest = JSON.parse(readFileSync(join(dir, 'plugin.json'), 'utf8'));
    if (id === 'saas-kit-core') {
      assert.notEqual(agyManifest.disabled, true, 'saas-kit-core must be enabled by default');
    } else {
      assert.equal(agyManifest.disabled, true, `${id} must ship disabled: true by default`);
    }
  }

  // Root marketplace manifests
  const claudeMarketplace = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  const agyMarketplace = JSON.parse(readFileSync(join(ROOT, '.agents', 'plugins', 'marketplace.json'), 'utf8'));
  assert.equal(claudeMarketplace.plugins.length, 9);
  assert.equal(agyMarketplace.plugins.length, 9);
});

test('build-plugins: saas-kit-core includes both Antigravity root hooks.json and Claude hooks/hooks.json + 13 playbooks', () => {
  const coreDir = join(PLUGINS_DIR, 'saas-kit-core');
  assert.ok(existsSync(join(coreDir, 'hooks.json')), 'Antigravity native hooks.json must be at plugin root');
  assert.ok(existsSync(join(coreDir, 'hooks', 'hooks.json')), 'Claude Code hooks/hooks.json must exist');
  assert.ok(existsSync(join(coreDir, 'hooks', 'pre-tool-guard.mjs')), 'pre-tool-guard.mjs must be bundled');
  assert.ok(existsSync(join(coreDir, '.mcp.json')), 'Claude .mcp.json must exist');
  assert.ok(existsSync(join(coreDir, 'mcp_config.json')), 'Antigravity mcp_config.json must exist');
  assert.ok(existsSync(join(coreDir, 'index.mjs')), 'OpenCode index.mjs entrypoint must exist');

  const agyHooks = JSON.parse(readFileSync(join(coreDir, 'hooks.json'), 'utf8'));
  assert.ok(agyHooks['agentshield-pre-tool-guard']?.PreToolUse?.length > 0);

  const refsDir = join(coreDir, 'skills', 'saas-mode', 'references');
  const expectedPlaybooks = [
    'plan.md', 'build.md', 'review.md', 'ship.md', 'hotfix.md', 'meeting.md',
    'design.md', 'test.md', 'security.md', 'swarm.md', 'automate-me.md', 'reflect.md', 'correct.md',
  ];
  for (const pb of expectedPlaybooks) {
    assert.ok(existsSync(join(refsDir, pb)), `Missing lazy playbook: ${pb}`);
  }
});

test('build-plugins: total eager SKILL.md across all 9 plugins is <= 20 with zero duplicates', () => {
  const seen = new Map();
  for (const pluginId of readdirSync(PLUGINS_DIR)) {
    const skillsDir = join(PLUGINS_DIR, pluginId, 'skills');
    if (!existsSync(skillsDir)) continue;
    for (const skillName of readdirSync(skillsDir)) {
      const skillFile = join(skillsDir, skillName, 'SKILL.md');
      if (!existsSync(skillFile)) continue;
      assert.ok(!seen.has(skillName), `Duplicate eager skill "${skillName}" in ${pluginId} and ${seen.get(skillName)}`);
      seen.set(skillName, pluginId);
    }
  }
  assert.ok(seen.size > 0 && seen.size <= 20, `Expected 1..20 total eager skills across all 9 plugins, got ${seen.size}`);
});

test('build-plugins: generates native Antigravity sandboxed subagents/*.json for all 14 Senior Experts', () => {
  const foundExperts = new Map();
  for (const pluginId of readdirSync(PLUGINS_DIR)) {
    const subDir = join(PLUGINS_DIR, pluginId, 'subagents');
    if (!existsSync(subDir)) continue;
    for (const file of readdirSync(subDir)) {
      if (!file.endsWith('.json')) continue;
      const spec = JSON.parse(readFileSync(join(subDir, file), 'utf8'));
      assert.ok(spec.name && spec.role && spec.model && spec.workspace && spec.systemPrompt);
      if (spec.name === 'tech-lead') {
        assert.equal(spec.enableSubagentTools, true);
      } else {
        assert.equal(spec.enableSubagentTools, false, `${spec.name} must enforce DAG enableSubagentTools: false`);
      }
      if (spec.name === 'security-auditor') {
        assert.equal(spec.enableWriteTools, false, 'security-auditor must be read-only');
      }
      foundExperts.set(spec.name, spec);
    }
  }
  assert.equal(foundExperts.size, 14, `Expected 14 native subagent JSON specs, got ${foundExperts.size}`);
});

test('build-plugins: OpenCode saas-kit-core index.mjs exports working tool.execute.before & permission.ask hooks', async () => {
  const mod = await import(pathToFileURL(join(PLUGINS_DIR, 'saas-kit-core', 'index.mjs')).href);
  assert.equal(typeof mod.SaasKitCorePlugin, 'function');
  const hooks = await mod.SaasKitCorePlugin({});
  assert.equal(typeof hooks['tool.execute.before'], 'function');
  assert.equal(typeof hooks['permission.ask'], 'function');

  await assert.rejects(
    () => hooks['tool.execute.before']({ tool: 'bash' }, { args: { command: 'rm -rf /' } }),
    /AgentShield/i,
  );

  const permOut = { status: 'allow' };
  await hooks['permission.ask']({ type: 'edit', file: '.env.production' }, permOut);
  assert.equal(permOut.status, 'deny');
});

test('build-plugins: bundles skill helper scripts and embeds Mandatory Router Skill Protocol in agents & subagents', () => {
  // Helper scripts bundled for document-office skills
  for (const s of ['docx', 'xlsx', 'pptx', 'pdf', 'latex-paper-writing']) {
    const scriptsDir = join(PLUGINS_DIR, 'saas-kit-document-office', 'skills', 'document-specialist-expert', 'scripts', s);
    assert.ok(existsSync(scriptsDir), `Missing bundled scripts/ for ${s}`);
  }

  // 2-hop Mandatory Router Skill Protocol embedded in both Markdown & JSON subagent
  const nestMd = readFileSync(join(PLUGINS_DIR, 'saas-kit-nestjs-backend', 'agents', 'nestjs.md'), 'utf8');
  const nestSub = JSON.parse(readFileSync(join(PLUGINS_DIR, 'saas-kit-nestjs-backend', 'subagents', 'nestjs.json'), 'utf8'));
  assert.match(nestMd, /Mandatory Router Skill Protocol/);
  assert.match(nestMd, /skills\/nestjs-expert\/SKILL\.md/);
  assert.match(nestSub.systemPrompt, /skills\/nestjs-expert\/SKILL\.md/);
});

test('build-plugins --check passes immediately after fresh build', () => {
  execFileSync(process.execPath, [BUILD_SCRIPT, '--check'], { cwd: ROOT, encoding: 'utf8' });
});
