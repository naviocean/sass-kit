#!/usr/bin/env node

/**
 * Multi-Harness Plugin Compiler (build-plugins.mjs)
 *
 * Compiles Single Source of Truth (.agent-core/) into 9 modular Squad Plugins
 * under plugins/saas-kit-* + root Marketplace manifests for:
 *   - Claude Code (.claude-plugin/marketplace.json + .claude-plugin/plugin.json + hooks/hooks.json)
 *   - Antigravity (.agents/plugins/marketplace.json + plugin.json + root hooks.json + subagents/*.json)
 *   - OpenCode (package.json + index.mjs + agents/ + commands/ + skills/)
 *
 * Usage:
 *   node scripts/build-plugins.mjs [--clean] [--only <squad>] [--check]
 */

import { createHash } from 'node:crypto';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CORE_DIR = join(ROOT, '.agent-core');

const PLAYBOOKS = [
  'plan', 'build', 'review', 'ship', 'hotfix', 'meeting',
  'design', 'test', 'security', 'swarm', 'automate-me', 'reflect', 'correct',
];

const CORE_BUNDLED_SCRIPTS = [
  'security-gate.mjs',
  'repo-scanner.mjs',
  'triage-sizer.mjs',
  'configure-models.mjs',
  'experience-library.mjs',
];

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function writeText(filePath, content) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf8');
}

function parseFrontmatter(md) {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: md };
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      meta[key] = val;
    }
  }
  return { meta, body: match[2].trim() };
}

function extractSkillDescription(skillMdPath) {
  if (!existsSync(skillMdPath)) return '';
  const raw = readFileSync(skillMdPath, 'utf8');
  const match = raw.match(/description:\s*(?:>-?\r?\n\s*)?([^\r\n]+)/);
  return match ? match[1].replace(/^["']|["']$/g, '').trim() : '';
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const st = statSync(srcPath);
    if (st.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (st.isFile()) {
      copyFileSync(srcPath, destPath);
    }
  }
}

function buildRouterSkill({ pluginDir, routerSkillName, squadName, squadDescription, expertNames, refSkills }) {
  const skillDir = join(pluginDir, 'skills', routerSkillName);
  const refsDir = join(skillDir, 'references');
  ensureDir(refsDir);

  const indexRows = [];
  for (const skillName of refSkills) {
    const srcSkillDir = join(CORE_DIR, 'skills', skillName);
    const srcSkillMd = join(srcSkillDir, 'SKILL.md');
    if (!existsSync(srcSkillMd)) continue;
    copyFileSync(srcSkillMd, join(refsDir, `${skillName}.md`));

    let scriptNote = '—';
    const srcScriptsDir = join(srcSkillDir, 'scripts');
    if (existsSync(srcScriptsDir) && statSync(srcScriptsDir).isDirectory()) {
      copyDirRecursive(srcScriptsDir, join(skillDir, 'scripts', skillName));
      scriptNote = `\`scripts/${skillName}/\``;
    }

    const desc = extractSkillDescription(srcSkillMd) || `${skillName} reference guide`;
    indexRows.push(`| \`${skillName}\` | \`references/${skillName}.md\` | ${scriptNote} | ${desc.slice(0, 110)} |`);
  }

  const skillMd = `---
name: ${routerSkillName}
description: >-
  Router skill for ${squadName} (${expertNames.join(', ')}). ${squadDescription}
  Loads deep domain guides lazily from references/ on demand to keep context lean.
---

# ${routerSkillName}

Consolidated domain router for **${squadName}** (experts: ${expertNames.map((e) => `\`${e}\``).join(', ')}).

**MANDATORY**: Before writing code or giving domain advice, read the matching reference file(s) below (and use bundled helper scripts where listed):

| Topic | Reference File | Helper Scripts | Summary |
|---|---|---|---|
${indexRows.join('\n')}
`;

  writeText(join(skillDir, 'SKILL.md'), skillMd);
}

function splitSquadSkillsForRouters(squadKey, routerSkills, skillsList) {
  if (routerSkills.length === 1) {
    return new Map([[routerSkills[0], skillsList]]);
  }

  if (squadKey === 'core') {
    const qaSec = [];
    const coreEng = [];
    const qaSecPatterns = /(test|vitest|playwright|e2e|tdd|security|secret|auth|verify|verification|forensics|benchmark|diagnose|debug|adversarial|comment-quality)/i;
    for (const s of skillsList) {
      if (s === 'saas-help' || s === 'saas-mode') continue;
      if (qaSecPatterns.test(s)) qaSec.push(s);
      else coreEng.push(s);
    }
    return new Map([
      ['core-engineering', coreEng],
      ['qa-security-expert', qaSec],
    ]);
  }

  if (squadKey === 'web-frontend') {
    const designer = [];
    const frontend = [];
    const designPatterns = /(design|visual|minimalist|brutalist|stitch|pencil|ux|information-architecture|taste|interaction)/i;
    for (const s of skillsList) {
      if (designPatterns.test(s)) designer.push(s);
      else frontend.push(s);
    }
    return new Map([
      ['frontend-expert', frontend],
      ['designer-expert', designer],
    ]);
  }

  if (squadKey === 'python-ai') {
    const ai = [];
    const py = [];
    const aiPatterns = /(langgraph|langchain|rag|llm|prompt|deepagents|pydantic-ai)/i;
    for (const s of skillsList) {
      if (aiPatterns.test(s)) ai.push(s);
      else py.push(s);
    }
    return new Map([
      ['ai-engineer-expert', ai],
      ['python-backend-expert', py],
    ]);
  }

  return new Map([[routerSkills[0], skillsList]]);
}

function buildMcpConfigs(pluginDir) {
  const opencodePath = join(ROOT, 'opencode.json');
  const mcpServers = {};
  if (existsSync(opencodePath)) {
    const oc = JSON.parse(readFileSync(opencodePath, 'utf8'));
    for (const [name, cfg] of Object.entries(oc.mcp || {})) {
      if (cfg.type === 'local' && Array.isArray(cfg.command) && cfg.command.length > 0) {
        mcpServers[name] = {
          command: cfg.command[0],
          args: cfg.command.slice(1),
        };
      } else if (cfg.type === 'remote' && cfg.url) {
        mcpServers[name] = {
          url: cfg.url,
        };
      }
    }
  }
  const payload = { mcpServers };
  writeJson(join(pluginDir, '.mcp.json'), payload);
  writeJson(join(pluginDir, 'mcp_config.json'), payload);
}

function buildCoreExtras(pluginDir, roster) {
  // 1. Entrypoint skills: saas-help & saas-mode + 13 lazy playbooks
  ensureDir(join(pluginDir, 'skills', 'saas-help'));
  copyFileSync(
    join(CORE_DIR, 'skills', 'saas-help', 'SKILL.md'),
    join(pluginDir, 'skills', 'saas-help', 'SKILL.md'),
  );
  ensureDir(join(pluginDir, 'skills', 'saas-mode', 'references'));
  copyFileSync(
    join(CORE_DIR, 'skills', 'saas-mode', 'SKILL.md'),
    join(pluginDir, 'skills', 'saas-mode', 'SKILL.md'),
  );

  for (const pb of PLAYBOOKS) {
    const src = join(CORE_DIR, 'commands', `${pb}.md`);
    if (existsSync(src)) {
      copyFileSync(src, join(pluginDir, 'skills', 'saas-mode', 'references', `${pb}.md`));
    }
  }

  // 2. Thin slash command wrappers for Claude Code & OpenCode
  ensureDir(join(pluginDir, 'commands'));
  writeText(
    join(pluginDir, 'commands', 'saas-help.md'),
    '# /saas-help\n\nActivate the `saas-help` skill (`skills/saas-help/SKILL.md`) to guide the user through SaaS Kit v2.0, installed squads, and model preset onboarding.\n',
  );
  writeText(
    join(pluginDir, 'commands', 'saas-mode.md'),
    '# /saas-mode\n\nActivate the `saas-mode` skill (`skills/saas-mode/SKILL.md`) to orchestrate the user request with Adaptive Socratic Sizing, Roster-Locked Parallel Dispatch, and lazy playbooks.\n',
  );
  for (const pb of PLAYBOOKS) {
    const cmdName = pb === 'swarm' ? 'saas-swarm' : pb;
    writeText(
      join(pluginDir, 'commands', `${cmdName}.md`),
      `# /${cmdName}\n\nActivate \`saas-mode\` and execute the lazy playbook at \`skills/saas-mode/references/${pb}.md\` following \`rules/AGENTS.md\` and \`roster.json\`.\n`,
    );
  }

  // 3. Multi-harness AgentShield hooks
  ensureDir(join(pluginDir, 'hooks'));
  const guardDest = join(pluginDir, 'hooks', 'pre-tool-guard.mjs');
  copyFileSync(join(CORE_DIR, 'hooks', 'pre-tool-guard.mjs'), guardDest);
  chmodSync(guardDest, 0o755);

  // Antigravity native root hooks.json
  writeJson(join(pluginDir, 'hooks.json'), {
    'agentshield-pre-tool-guard': {
      PreToolUse: [
        {
          matcher: 'run_command|write_file|edit_file',
          hooks: [
            {
              type: 'command',
              command: 'node ./hooks/pre-tool-guard.mjs --harness antigravity',
              timeout: 10,
            },
          ],
        },
      ],
    },
  });

  // Claude Code hooks/hooks.json
  writeJson(join(pluginDir, 'hooks', 'hooks.json'), {
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash|Write|Edit',
          hooks: [
            {
              type: 'command',
              command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-guard.mjs" --harness claude',
            },
          ],
        },
      ],
    },
  });

  // 4. MCP configs
  buildMcpConfigs(pluginDir);

  // 5. Presets bundle
  const presetsSrc = join(CORE_DIR, 'presets');
  const presetsDest = join(pluginDir, 'presets');
  ensureDir(presetsDest);
  for (const file of readdirSync(presetsSrc)) {
    if (file.endsWith('.json')) {
      copyFileSync(join(presetsSrc, file), join(presetsDest, file));
    }
  }

  // 6. Standards & templates
  const standardsSrc = join(CORE_DIR, 'standards');
  const standardsDest = join(pluginDir, 'standards');
  ensureDir(standardsDest);
  for (const file of readdirSync(standardsSrc)) {
    const full = join(standardsSrc, file);
    if (statSync(full).isFile()) {
      copyFileSync(full, join(standardsDest, file));
    }
  }

  // 7. Bundled runtime scripts + roster.json
  const scriptsDest = join(pluginDir, 'scripts');
  ensureDir(scriptsDest);
  for (const scriptName of CORE_BUNDLED_SCRIPTS) {
    const src = join(ROOT, 'scripts', scriptName);
    if (existsSync(src)) {
      copyFileSync(src, join(scriptsDest, scriptName));
    }
  }
  writeJson(join(scriptsDest, 'roster.json'), roster);
  writeJson(join(pluginDir, 'roster.json'), roster);

  // 8. OpenCode @opencode-ai/plugin ESM entrypoint
  writeText(
    join(pluginDir, 'index.mjs'),
    `import { evaluateToolCall, isSensitiveFile } from './hooks/pre-tool-guard.mjs';
import { resolveActiveModels } from './scripts/configure-models.mjs';

export { resolveActiveModels };

export const SaasKitCorePlugin = async () => {
  return {
    'tool.execute.before': async (input, output) => {
      const toolName = input?.tool || '';
      const toolArgs = output?.args || input?.args || {};
      const verdict = evaluateToolCall(toolName, toolArgs);
      if (verdict.blocked) {
        throw new Error(\`AgentShield Runtime Guard Block: \${verdict.reason}\`);
      }
    },
    'permission.ask': async (perm, out) => {
      const targetFile = perm?.file || perm?.path || '';
      if (targetFile && isSensitiveFile(targetFile)) {
        out.status = 'deny';
      }
    },
  };
};

export default SaasKitCorePlugin;
`,
  );
}

function buildSquadPlugin({ outPluginsDir, squadKey, squad, roster, skillPacks }) {
  const pluginDir = join(outPluginsDir, squad.pluginId);
  ensureDir(pluginDir);

  const version = roster.version || '2.0.0';
  const owner = roster.marketplace.owner;
  const repoUrl = `https://github.com/${roster.marketplace.repo}`;

  // 1. Claude Code & Codex manifests
  const pluginManifest = {
    name: squad.pluginId,
    version,
    description: squad.description,
    author: owner,
    repository: repoUrl,
    license: 'MIT',
  };
  writeJson(join(pluginDir, '.claude-plugin', 'plugin.json'), pluginManifest);
  writeJson(join(pluginDir, '.codex-plugin', 'plugin.json'), pluginManifest);

  // 2. Antigravity native manifest
  const agyManifest = {
    name: squad.pluginId,
    version,
    description: squad.description,
    author: owner,
    repository: { type: 'git', url: repoUrl },
  };
  if (!squad.defaultEnabled) {
    agyManifest.disabled = true;
  }
  writeJson(join(pluginDir, 'plugin.json'), agyManifest);

  // 3. OpenCode package.json
  const pkgJson = {
    name: `@saas-kit/${squad.pluginId.replace(/^saas-kit-/, '')}`,
    version,
    type: 'module',
    description: squad.description,
    license: 'MIT',
    repository: { type: 'git', url: `${repoUrl}.git` },
  };
  if (squadKey === 'core') {
    pkgJson.main = './index.mjs';
    pkgJson.exports = { '.': './index.mjs' };
  } else {
    pkgJson.peerDependencies = { '@saas-kit/core': `^${version}` };
  }
  writeJson(join(pluginDir, 'package.json'), pkgJson);

  // 4. Consolidated Antigravity rules/AGENTS.md
  if (squadKey === 'core') {
    const ruleParts = [];
    for (const ruleFile of readdirSync(join(CORE_DIR, 'rules')).sort()) {
      if (!ruleFile.endsWith('.md')) continue;
      ruleParts.push(readFileSync(join(CORE_DIR, 'rules', ruleFile), 'utf8').trim());
    }
    writeText(join(pluginDir, 'rules', 'AGENTS.md'), ruleParts.join('\n\n---\n\n') + '\n');
  } else {
    const expertsSummary = squad.agents
      .map((a) => {
        const exp = roster.experts[a];
        return `- **\`${a}\`** (${exp.role}): owns ${exp.ownedPaths.map((p) => `\`${p}\``).join(', ') || 'domain-scoped files'}`;
      })
      .join('\n');
    writeText(
      join(pluginDir, 'rules', 'AGENTS.md'),
      `# ${squad.name} (${squad.pluginId})\n\nPrerequisite: \`saas-kit-core\` must be enabled.\n\n## Registered Senior Experts\n\n${expertsSummary}\n\n## Domain Boundary\n\nExperts in this squad run with \`enableSubagentTools: false\` (DAG rule) and must only modify their declared owned paths.\n`,
    );
  }

  // 5. Agents (Markdown for Claude Code/OpenCode) + Native Sandboxed Subagents (JSON for Antigravity)
  ensureDir(join(pluginDir, 'agents'));
  ensureDir(join(pluginDir, 'subagents'));
  for (const agentName of squad.agents) {
    const expert = roster.experts[agentName];
    const srcAgentPath = join(CORE_DIR, 'agents', `${agentName}.md`);
    const rawMd = readFileSync(srcAgentPath, 'utf8');
    const { meta, body } = parseFrontmatter(rawMd);

    const routerSkill = expert.routerSkill;
    const routerProtocol = `## Mandatory Router Skill Protocol (2-Hop Anti-Laziness)

Before implementing, reviewing, or answering domain-specific tasks:
1. Read \`skills/${routerSkill}/SKILL.md\` in \`${squad.pluginId}\`.
2. Open and follow EVERY matching guide in \`skills/${routerSkill}/references/*.md\` (and use bundled helper scripts in \`skills/${routerSkill}/scripts/\` when listed).
3. Do NOT fall back to generic boilerplate when a domain reference guide exists.`;

    const enrichedBody = `${routerProtocol}\n\n${body}`;

    // Claude Code / OpenCode agent markdown (uses Claude default model tier cleanly)
    const claudeModel = expert.defaultModelTier?.claude || 'sonnet';
    const compiledMd = `---
name: ${agentName}
description: ${meta.description || expert.role}
model: ${claudeModel}
---

${enrichedBody}
`;
    writeText(join(pluginDir, 'agents', `${agentName}.md`), compiledMd);

    // Antigravity native sandboxed subagent JSON (pstack-antigravity contract)
    const subagentJson = {
      name: agentName,
      role: expert.role,
      description: meta.description || expert.role,
      model: expert.defaultModelTier?.antigravity || 'flash',
      workspace: expert.sandbox.workspace,
      enableWriteTools: expert.sandbox.enableWriteTools,
      enableSubagentTools: expert.sandbox.enableSubagentTools,
      enableMCPTools: expert.sandbox.enableMCPTools,
      systemPrompt: enrichedBody,
    };
    writeJson(join(pluginDir, 'subagents', `${agentName}.json`), subagentJson);
  }

  // 6. Router Skills + lazy references/
  const packSkills = skillPacks.packs[squadKey]?.skills || [];
  const routerList = squad.routerSkills.filter((r) => r !== 'saas-help' && r !== 'saas-mode');
  const routerMap = splitSquadSkillsForRouters(squadKey, routerList, packSkills);
  for (const [routerName, refSkills] of routerMap.entries()) {
    buildRouterSkill({
      pluginDir,
      routerSkillName: routerName,
      squadName: squad.name,
      squadDescription: squad.description,
      expertNames: squad.agents,
      refSkills,
    });
  }

  // 7. Core extras
  if (squadKey === 'core') {
    buildCoreExtras(pluginDir, roster);
  }
}

function buildMarketplaceManifests(outRoot, roster) {
  const version = roster.version || '2.0.0';
  const pluginsList = Object.values(roster.squads).map((squad) => ({
    name: squad.pluginId,
    version,
    description: squad.description,
    source: `./plugins/${squad.pluginId}`,
  }));

  const manifest = {
    name: roster.marketplace.name,
    owner: roster.marketplace.owner,
    description: 'Plugin-first multi-agent SaaS development team kit for Claude Code, Antigravity, and OpenCode — 14 Senior Experts across 9 Squad Plugins.',
    plugins: pluginsList,
  };

  writeJson(join(outRoot, '.claude-plugin', 'marketplace.json'), manifest);
  writeJson(join(outRoot, '.agents', 'plugins', 'marketplace.json'), manifest);
}

function hashTree(baseDir, subPaths) {
  const hashes = new Map();
  function walk(target) {
    if (!existsSync(target)) return;
    const st = statSync(target);
    if (st.isDirectory()) {
      for (const entry of readdirSync(target).sort()) {
        walk(join(target, entry));
      }
    } else if (st.isFile()) {
      const rel = relative(baseDir, target).replace(/\\/g, '/');
      const digest = createHash('sha256').update(readFileSync(target)).digest('hex');
      hashes.set(rel, digest);
    }
  }
  for (const sub of subPaths) {
    walk(join(baseDir, sub));
  }
  return hashes;
}

export function buildAllPlugins({ outRoot = ROOT, clean = false, only = null } = {}) {
  const roster = JSON.parse(readFileSync(join(CORE_DIR, 'roster.json'), 'utf8'));
  const skillPacks = JSON.parse(readFileSync(join(CORE_DIR, 'skill-packs.json'), 'utf8'));
  const outPluginsDir = join(outRoot, 'plugins');

  if (clean && existsSync(outPluginsDir)) {
    rmSync(outPluginsDir, { recursive: true, force: true });
  }
  ensureDir(outPluginsDir);

  const squadEntries = Object.entries(roster.squads).filter(([k]) => !only || k === only);
  if (squadEntries.length === 0) {
    throw new Error(`Unknown squad "${only}". Valid: ${Object.keys(roster.squads).join(', ')}`);
  }

  for (const [squadKey, squad] of squadEntries) {
    buildSquadPlugin({ outPluginsDir, squadKey, squad, roster, skillPacks });
  }

  if (!only) {
    buildMarketplaceManifests(outRoot, roster);
  }

  return { squadCount: squadEntries.length };
}

function runCheck() {
  const tempRoot = mkdtempSync(join(tmpdir(), 'saas-kit-check-'));
  try {
    buildAllPlugins({ outRoot: tempRoot, clean: true });
    const tracked = ['plugins', '.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json'];
    const expected = hashTree(tempRoot, tracked);
    const actual = hashTree(ROOT, tracked);

    const diffs = [];
    for (const [file, hash] of expected.entries()) {
      if (!actual.has(file)) diffs.push(`MISSING: ${file}`);
      else if (actual.get(file) !== hash) diffs.push(`DRIFT: ${file}`);
    }
    for (const file of actual.keys()) {
      if (!expected.has(file)) diffs.push(`EXTRA: ${file}`);
    }

    if (diffs.length > 0) {
      console.error(`Plugin build drift detected (${diffs.length} differences):\n` + diffs.slice(0, 20).join('\n'));
      process.exit(1);
    }
    console.log(`✔ Plugin build is up-to-date (${expected.size} files verified)`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function runCli(argv) {
  const args = argv.slice(2);
  let clean = false;
  let check = false;
  let only = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--clean') clean = true;
    else if (args[i] === '--check') check = true;
    else if (args[i] === '--only' && args[i + 1]) only = args[++i];
    else if (args[i].startsWith('--only=')) only = args[i].split('=')[1];
  }

  if (check) {
    runCheck();
    return;
  }

  const { squadCount } = buildAllPlugins({ outRoot: ROOT, clean, only });
  console.log(`✔ Built ${squadCount} multi-harness squad plugin(s) into plugins/`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runCli(process.argv);
}
