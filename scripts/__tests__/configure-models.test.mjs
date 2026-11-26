#!/usr/bin/env node

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  listAvailablePresets,
  resolveActiveModels,
  saveUserModelConfig,
  applyOpencodeConfig,
} from '../configure-models.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, '..', 'configure-models.mjs');

test('configure-models: lists all built-in presets including all 5 OpenCode presets', () => {
  const presets = listAvailablePresets();
  for (const expected of [
    'opencode',
    'opencode-cc-pro',
    'opencode-cc-hybrid',
    'opencode-cc-deepseek',
    'opencode-cc-luna',
    'claude',
    'antigravity',
  ]) {
    assert.ok(presets.includes(expected), `Missing preset: ${expected}`);
  }
});

test('configure-models: resolves priority SAAS_KIT_PRESET > models.json > session fallback', () => {
  const tempHome = mkdtempSync(join(tmpdir(), 'saas-kit-models-'));
  try {
    // 1. No config & no env -> session fallback
    const fallback = resolveActiveModels({ homeDir: tempHome, env: {} });
    assert.equal(fallback.source, 'session-fallback');
    assert.equal(fallback.preset, null);

    // 2. User config saved -> models.json wins
    saveUserModelConfig({ preset: 'opencode-cc-pro', overrides: { frontend: 'custom/fast-model' } }, { homeDir: tempHome });
    const fromFile = resolveActiveModels({ homeDir: tempHome, env: {} });
    assert.equal(fromFile.source, 'user-config');
    assert.equal(fromFile.preset, 'opencode-cc-pro');
    assert.equal(fromFile.agents['tech-lead'].model, 'commandcode/deepseek/deepseek-v4-pro');
    assert.equal(fromFile.agents.frontend.model, 'custom/fast-model');

    // 3. SAAS_KIT_PRESET env overrides saved preset
    const fromEnv = resolveActiveModels({ homeDir: tempHome, env: { SAAS_KIT_PRESET: 'opencode' } });
    assert.equal(fromEnv.source, 'env');
    assert.equal(fromEnv.preset, 'opencode');
    assert.equal(fromEnv.agents['tech-lead'].model, 'opencode-go/deepseek-v4-pro');
    assert.equal(fromEnv.agents.frontend.model, 'custom/fast-model');
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

test('configure-models: --apply-opencode merges agent models safely into opencode.json without clobbering mcp', () => {
  const tempHome = mkdtempSync(join(tmpdir(), 'saas-kit-oc-'));
  const targetOpencode = join(tempHome, 'opencode.json');
  try {
    writeFileSync(targetOpencode, JSON.stringify({ mcp: { icm: { enabled: true } } }, null, 2));
    saveUserModelConfig({ preset: 'opencode-cc-pro', overrides: {} }, { homeDir: tempHome });
    applyOpencodeConfig({ homeDir: tempHome, opencodeConfigPath: targetOpencode, env: {} });

    const updated = JSON.parse(readFileSync(targetOpencode, 'utf8'));
    assert.equal(updated.mcp.icm.enabled, true, 'Existing mcp config must be preserved');
    assert.equal(updated.agent['tech-lead'].model, 'commandcode/deepseek/deepseek-v4-pro');
    assert.equal(updated.agent['ai-engineer'].model, 'commandcode/openai/gpt-6-luna');
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

test('configure-models CLI: --preset and --set persist to XDG/HOME config path', () => {
  const tempHome = mkdtempSync(join(tmpdir(), 'saas-kit-cli-'));
  try {
    execFileSync(process.execPath, [SCRIPT, '--preset', 'opencode-cc-pro', '--set', 'qa=custom/qa-model'], {
      env: { ...process.env, HOME: tempHome, XDG_CONFIG_HOME: join(tempHome, '.config') },
      encoding: 'utf8',
    });
    const configPath = join(tempHome, '.config', 'saas-kit', 'models.json');
    assert.ok(existsSync(configPath), 'models.json should be created');
    const saved = JSON.parse(readFileSync(configPath, 'utf8'));
    assert.equal(saved.preset, 'opencode-cc-pro');
    assert.equal(saved.overrides.qa, 'custom/qa-model');
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

test('configure-models: antigravity preset maps all 14 experts to Gemini 4 Orchestrator/Neon/Hydrogen models', () => {
  const tempHome = mkdtempSync(join(tmpdir(), 'saas-kit-agy-'));
  try {
    const resolved = resolveActiveModels({ homeDir: tempHome, env: { SAAS_KIT_PRESET: 'antigravity' } });
    assert.equal(resolved.preset, 'antigravity');
    assert.equal(Object.keys(resolved.agents).length, 14);
    assert.equal(resolved.agents['tech-lead'].model, 'gemini-pro-orchestrator-neon');
    assert.equal(resolved.agents.pm.model, 'gemini-4-neon-high');
    assert.equal(resolved.agents['security-auditor'].model, 'gemini-4-neon-high');
    assert.equal(resolved.agents['ai-engineer'].model, 'gemini-4-neon-medium');
    assert.equal(resolved.agents.rustacean.model, 'gemini-4-neon-medium');
    assert.equal(resolved.agents.frontend.model, 'gemini-4-hydrogen-high');
    assert.equal(resolved.agents.qa.model, 'gemini-4-hydrogen-medium');

    for (const [name, cfg] of Object.entries(resolved.agents)) {
      assert.match(
        cfg.model,
        /^(gemini-4-|gemini-pro-orchestrator-)/,
        `Agent ${name} should use a Gemini 4 or Orchestrator model, got ${cfg.model}`,
      );
    }
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
});
