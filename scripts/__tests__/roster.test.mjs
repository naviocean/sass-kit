#!/usr/bin/env node

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const CORE_DIR = join(ROOT, '.agent-core');

const roster = JSON.parse(readFileSync(join(CORE_DIR, 'roster.json'), 'utf8'));
const skillPacks = JSON.parse(readFileSync(join(CORE_DIR, 'skill-packs.json'), 'utf8'));

test('roster.json defines exactly 9 squads and 14 Senior Experts', () => {
  assert.equal(Object.keys(roster.squads).length, 9);
  assert.equal(Object.keys(roster.experts).length, 14);
});

test('every expert in roster.json has a matching .agent-core/agents/<name>.md and valid sandbox flags', () => {
  for (const [name, expert] of Object.entries(roster.experts)) {
    const agentPath = join(CORE_DIR, 'agents', `${name}.md`);
    assert.ok(existsSync(agentPath), `Missing agent definition: ${agentPath}`);
    assert.ok(roster.squads[expert.squad], `Unknown squad "${expert.squad}" for expert "${name}"`);
    assert.equal(expert.pluginId, roster.squads[expert.squad].pluginId);

    // DAG rule: only tech-lead may spawn subagents
    if (name === 'tech-lead') {
      assert.equal(expert.sandbox.enableSubagentTools, true, 'tech-lead must have enableSubagentTools: true');
    } else {
      assert.equal(expert.sandbox.enableSubagentTools, false, `${name} must have enableSubagentTools: false (DAG rule)`);
    }

    // Least privilege: security-auditor is read-only
    if (name === 'security-auditor') {
      assert.equal(expert.sandbox.enableWriteTools, false, 'security-auditor must be read-only');
    }
  }
});

test('total Router Skills across all 9 squads is <= 20 (eager catalog budget)', () => {
  const allRouterSkills = [];
  for (const squad of Object.values(roster.squads)) {
    allRouterSkills.push(...squad.routerSkills);
  }
  const unique = new Set(allRouterSkills);
  assert.equal(unique.size, allRouterSkills.length, 'Duplicate router skill names across squads');
  assert.ok(allRouterSkills.length <= 20, `Expected <= 20 router skills, got ${allRouterSkills.length}`);
});

test('skill-packs.json has zero duplicate skills across squads', () => {
  const seen = new Map();
  for (const [packName, pack] of Object.entries(skillPacks.packs)) {
    for (const skill of pack.skills) {
      assert.ok(!seen.has(skill), `Duplicate skill "${skill}" in "${packName}" and "${seen.get(skill)}"`);
      seen.set(skill, packName);
    }
  }
});

test('all 13 lazy playbooks exist in .agent-core/commands/ and 2 entrypoint skills exist', () => {
  const expectedPlaybooks = [
    'plan', 'build', 'review', 'ship', 'hotfix', 'meeting',
    'design', 'test', 'security', 'swarm', 'automate-me', 'reflect', 'correct',
  ];
  for (const name of expectedPlaybooks) {
    assert.ok(existsSync(join(CORE_DIR, 'commands', `${name}.md`)), `Missing playbook: ${name}.md`);
  }
  assert.ok(existsSync(join(CORE_DIR, 'skills', 'saas-help', 'SKILL.md')));
  assert.ok(existsSync(join(CORE_DIR, 'skills', 'saas-mode', 'SKILL.md')));
  assert.ok(existsSync(join(CORE_DIR, 'rules', 'roster-guard.md')));
});

test('zero hardcoded .opencode/ paths remain in .agent-core/agents/ or .agent-core/commands/', () => {
  for (const sub of ['agents', 'commands']) {
    const dir = join(CORE_DIR, sub);
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const content = readFileSync(join(dir, file), 'utf8');
      assert.ok(!content.includes('.opencode/'), `Found hardcoded .opencode/ in ${sub}/${file}`);
    }
  }
});
