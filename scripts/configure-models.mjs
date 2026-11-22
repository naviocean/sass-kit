#!/usr/bin/env node

/**
 * External Model Preset & Override Manager (configure-models.mjs)
 *
 * Persists user model presets & per-agent overrides exclusively to
 * ~/.config/saas-kit/models.json (never mutating plugin files).
 *
 * Resolution priority:
 *   1. process.env.SAAS_KIT_PRESET
 *   2. ~/.config/saas-kit/models.json
 *   3. session-fallback (no hardcoded provider)
 *
 * Usage:
 *   node scripts/configure-models.mjs --list-presets
 *   node scripts/configure-models.mjs --preset opencode-cc-pro [--set agent=model] [--apply-opencode]
 *   node scripts/configure-models.mjs --show
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolvePresetsDir(explicitDir) {
  if (explicitDir && existsSync(explicitDir)) return explicitDir;
  const pluginPresets = resolve(__dirname, '..', 'presets');
  if (existsSync(pluginPresets)) return pluginPresets;
  return resolve(__dirname, '..', '.agent-core', 'presets');
}

export function getUserConfigPath({ homeDir, env = process.env } = {}) {
  const base = homeDir
    ? join(homeDir, '.config')
    : env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(base, 'saas-kit', 'models.json');
}

export function listAvailablePresets({ presetsDir } = {}) {
  const dir = resolvePresetsDir(presetsDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.startsWith('agent-models-') && f.endsWith('.json'))
    .map((f) => f.replace(/^agent-models-/, '').replace(/\.json$/, ''))
    .sort();
}

export function loadPresetData(presetName, { presetsDir } = {}) {
  const dir = resolvePresetsDir(presetsDir);
  const filePath = join(dir, `agent-models-${presetName}.json`);
  if (!existsSync(filePath)) {
    throw new Error(`Unknown preset "${presetName}". Available: ${listAvailablePresets({ presetsDir }).join(', ')}`);
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function loadUserModelConfig(options = {}) {
  const configPath = getUserConfigPath(options);
  if (!existsSync(configPath)) return null;
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

export function saveUserModelConfig({ preset, overrides = {} }, options = {}) {
  const configPath = getUserConfigPath(options);
  mkdirSync(dirname(configPath), { recursive: true });
  const existing = loadUserModelConfig(options) || { preset: null, overrides: {} };
  const merged = {
    preset: preset !== undefined ? preset : existing.preset,
    overrides: { ...(existing.overrides || {}), ...overrides },
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(configPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  return { configPath, config: merged };
}

export function resolveActiveModels({ homeDir, env = process.env, presetsDir } = {}) {
  const userConfig = loadUserModelConfig({ homeDir, env });
  const envPreset = env.SAAS_KIT_PRESET && env.SAAS_KIT_PRESET.trim();
  const activePreset = envPreset || userConfig?.preset || null;
  const source = envPreset ? 'env' : userConfig?.preset ? 'user-config' : 'session-fallback';

  if (!activePreset) {
    return {
      source,
      preset: null,
      agents: {},
      overrides: userConfig?.overrides || {},
    };
  }

  const presetData = loadPresetData(activePreset, { presetsDir });
  const agents = {};
  for (const [name, cfg] of Object.entries(presetData.agents || {})) {
    agents[name] = { ...cfg };
  }
  for (const [name, model] of Object.entries(userConfig?.overrides || {})) {
    agents[name] = { ...(agents[name] || {}), model };
  }

  return {
    source,
    preset: activePreset,
    default_fallback: presetData.default_fallback || [],
    agents,
    overrides: userConfig?.overrides || {},
  };
}

export function applyOpencodeConfig({ homeDir, env = process.env, opencodeConfigPath, presetsDir } = {}) {
  const resolved = resolveActiveModels({ homeDir, env, presetsDir });
  if (!resolved.preset) {
    throw new Error('No active preset configured. Pass --preset <name> first.');
  }

  const targetPath =
    opencodeConfigPath ||
    join(homeDir ? join(homeDir, '.config') : env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'opencode', 'opencode.json');

  mkdirSync(dirname(targetPath), { recursive: true });
  const current = existsSync(targetPath) ? JSON.parse(readFileSync(targetPath, 'utf8')) : {};
  const nextAgentMap = { ...(current.agent || {}) };

  for (const [name, cfg] of Object.entries(resolved.agents)) {
    nextAgentMap[name] = {
      ...(nextAgentMap[name] || {}),
      model: cfg.model,
    };
  }

  const updated = { ...current, agent: nextAgentMap };
  writeFileSync(targetPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  return { targetPath, preset: resolved.preset, agentCount: Object.keys(resolved.agents).length };
}

function runCli(argv) {
  const args = argv.slice(2);
  let preset;
  const overrides = {};
  let listPresets = false;
  let show = false;
  let applyOpencode = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--list-presets') {
      listPresets = true;
    } else if (arg === '--show') {
      show = true;
    } else if (arg === '--apply-opencode') {
      applyOpencode = true;
    } else if (arg === '--preset' && args[i + 1]) {
      preset = args[++i];
    } else if (arg.startsWith('--preset=')) {
      preset = arg.split('=')[1];
    } else if (arg === '--set' && args[i + 1]) {
      const pair = args[++i];
      const eq = pair.indexOf('=');
      if (eq > 0) overrides[pair.slice(0, eq)] = pair.slice(eq + 1);
    } else if (arg.startsWith('--set=')) {
      const pair = arg.slice(6);
      const eq = pair.indexOf('=');
      if (eq > 0) overrides[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
  }

  if (listPresets) {
    console.log(listAvailablePresets().join('\n'));
    return;
  }

  if (preset !== undefined || Object.keys(overrides).length > 0) {
    if (preset) loadPresetData(preset);
    const { configPath } = saveUserModelConfig({ preset, overrides });
    console.log(`Saved model config to ${configPath}`);
  }

  if (applyOpencode) {
    const res = applyOpencodeConfig();
    console.log(`Applied preset "${res.preset}" (${res.agentCount} agents) to ${res.targetPath}`);
  }

  if (show || args.length === 0) {
    console.log(JSON.stringify(resolveActiveModels(), null, 2));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runCli(process.argv);
}
