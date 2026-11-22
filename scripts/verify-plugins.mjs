#!/usr/bin/env node

/**
 * Plugin & Marketplace Verifier (verify-plugins.mjs)
 *
 * Validates all 9 compiled squad plugins under plugins/ and both root
 * marketplace catalogs (.claude-plugin/marketplace.json & .agents/plugins/marketplace.json).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PLUGINS_DIR = join(ROOT, 'plugins');
const CORE_DIR = join(ROOT, '.agent-core');

const MAX_EAGER_SKILLS = 20;
const EXPECTED_PLAYBOOKS = [
  'plan', 'build', 'review', 'ship', 'hotfix', 'meeting',
  'design', 'test', 'security', 'swarm', 'automate-me', 'reflect', 'correct',
];

function runVerification() {
  const errors = [];
  let checks = 0;

  function check(condition, msg) {
    checks++;
    if (!condition) errors.push(msg);
  }

  const roster = JSON.parse(readFileSync(join(CORE_DIR, 'roster.json'), 'utf8'));

  // 1. Root Marketplace Manifests
  for (const rel of ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']) {
    const full = join(ROOT, rel);
    check(existsSync(full), `Missing marketplace manifest: ${rel}`);
    if (existsSync(full)) {
      const m = JSON.parse(readFileSync(full, 'utf8'));
      check(Array.isArray(m.plugins) && m.plugins.length === 9, `${rel} must list 9 plugins`);
      for (const p of m.plugins || []) {
        const target = resolve(ROOT, p.source);
        check(existsSync(target), `${rel} points to missing source: ${p.source}`);
      }
    }
  }

  // 2. Per-Plugin Manifests, Subagents DAG & Eager Skill Catalog Budget
  const eagerSkills = new Map();
  const subagentsFound = new Set();

  for (const [squadKey, squad] of Object.entries(roster.squads)) {
    const dir = join(PLUGINS_DIR, squad.pluginId);
    check(existsSync(dir), `Missing plugin directory: ${squad.pluginId}`);
    if (!existsSync(dir)) continue;

    check(existsSync(join(dir, '.claude-plugin', 'plugin.json')), `${squad.pluginId}: missing .claude-plugin/plugin.json`);
    check(existsSync(join(dir, '.codex-plugin', 'plugin.json')), `${squad.pluginId}: missing .codex-plugin/plugin.json`);
    check(existsSync(join(dir, 'plugin.json')), `${squad.pluginId}: missing Antigravity plugin.json`);
    check(existsSync(join(dir, 'package.json')), `${squad.pluginId}: missing OpenCode package.json`);
    check(existsSync(join(dir, 'rules', 'AGENTS.md')), `${squad.pluginId}: missing rules/AGENTS.md`);

    const agyManifest = JSON.parse(readFileSync(join(dir, 'plugin.json'), 'utf8'));
    if (squadKey === 'core') {
      check(agyManifest.disabled !== true, 'saas-kit-core must not be disabled by default');
      check(existsSync(join(dir, 'hooks.json')), 'saas-kit-core: missing root Antigravity hooks.json');
      check(existsSync(join(dir, 'hooks', 'hooks.json')), 'saas-kit-core: missing Claude hooks/hooks.json');
      check(existsSync(join(dir, 'hooks', 'pre-tool-guard.mjs')), 'saas-kit-core: missing pre-tool-guard.mjs');
      check(existsSync(join(dir, 'index.mjs')), 'saas-kit-core: missing OpenCode index.mjs');
      check(existsSync(join(dir, '.mcp.json')), 'saas-kit-core: missing .mcp.json');
      check(existsSync(join(dir, 'mcp_config.json')), 'saas-kit-core: missing mcp_config.json');

      for (const pb of EXPECTED_PLAYBOOKS) {
        check(
          existsSync(join(dir, 'skills', 'saas-mode', 'references', `${pb}.md`)),
          `saas-kit-core: missing lazy playbook references/${pb}.md`,
        );
      }
    } else {
      check(agyManifest.disabled === true, `${squad.pluginId}: domain squad must ship disabled: true by default`);
    }

    // Check agents & native subagents
    for (const agentName of squad.agents) {
      const expert = roster.experts[agentName];
      const agentMdPath = join(dir, 'agents', `${agentName}.md`);
      check(existsSync(agentMdPath), `${squad.pluginId}: missing agents/${agentName}.md`);
      if (existsSync(agentMdPath)) {
        const mdText = readFileSync(agentMdPath, 'utf8');
        check(
          mdText.includes(`skills/${expert.routerSkill}/SKILL.md`),
          `${squad.pluginId}: agents/${agentName}.md missing Mandatory Router Skill Protocol for ${expert.routerSkill}`,
        );
      }
      const subPath = join(dir, 'subagents', `${agentName}.json`);
      check(existsSync(subPath), `${squad.pluginId}: missing subagents/${agentName}.json`);
      if (existsSync(subPath)) {
        const spec = JSON.parse(readFileSync(subPath, 'utf8'));
        subagentsFound.add(spec.name);
        check(Boolean(spec.name && spec.role && spec.model && spec.workspace && spec.systemPrompt), `${subPath}: incomplete schema`);
        check(
          spec.systemPrompt.includes(`skills/${expert.routerSkill}/SKILL.md`),
          `${subPath}: missing Mandatory Router Skill Protocol for ${expert.routerSkill}`,
        );
        if (agentName === 'tech-lead') {
          check(spec.enableSubagentTools === true, 'tech-lead must have enableSubagentTools: true');
        } else {
          check(spec.enableSubagentTools === false, `${agentName} must have enableSubagentTools: false (DAG rule)`);
        }
        if (agentName === 'security-auditor') {
          check(spec.enableWriteTools === false, 'security-auditor must have enableWriteTools: false');
        }
      }
    }

    // Verify bundled skill helper scripts for key tool-backed squads
    if (squadKey === 'document-office') {
      for (const toolSkill of ['docx', 'xlsx', 'pptx', 'pdf', 'latex-paper-writing']) {
        check(
          existsSync(join(dir, 'skills', 'document-specialist-expert', 'scripts', toolSkill)),
          `${squad.pluginId}: missing bundled helper scripts for ${toolSkill}`,
        );
      }
    }

    // Count eager skills
    const skillsDir = join(dir, 'skills');
    if (existsSync(skillsDir)) {
      for (const skillName of readdirSync(skillsDir)) {
        if (!existsSync(join(skillsDir, skillName, 'SKILL.md'))) continue;
        check(!eagerSkills.has(skillName), `Duplicate eager skill "${skillName}" in ${squad.pluginId} and ${eagerSkills.get(skillName)}`);
        eagerSkills.set(skillName, squad.pluginId);
      }
    }
  }

  check(subagentsFound.size === 14, `Expected 14 Senior Expert subagents across plugins, found ${subagentsFound.size}`);
  check(
    eagerSkills.size > 0 && eagerSkills.size <= MAX_EAGER_SKILLS,
    `Eager skill catalog overflow: ${eagerSkills.size} > ${MAX_EAGER_SKILLS}`,
  );

  if (errors.length > 0) {
    console.error(`✘ Plugin verification failed (${errors.length} error(s) out of ${checks} checks):`);
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log(`✔ All ${checks} plugin verification checks passed (9 plugins, 14 subagents, ${eagerSkills.size} eager skills <= ${MAX_EAGER_SKILLS})`);
}

runVerification();
