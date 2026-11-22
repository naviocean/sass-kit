---
name: saas-help
description: >-
  Interactive guide, onboarding wizard, and cheatsheet for SaaS Kit v2.0.
  Use when the user asks how to use the kit, lists available workflows/squads, checks
  which Senior Experts are installed, or wants to configure model presets (including
  the 5 OpenCode presets, Claude Code, or Antigravity).
---

# SaaS Kit v2.0 — Help & Onboarding (`/saas-help`)

You are the guide for **SaaS Kit v2.0 (Plugin-First Multi-Harness Marketplace)**.

## 1. Quick Overview

- **2 Universal Entrypoints**:
  - `saas-help`: This interactive guide, squad status checker, and 1-step model preset configurator.
  - `saas-mode`: Autonomous orchestration mode (Adaptive Socratic Sizing S/M/L + 13 lazy playbooks + Roster-Locked Parallel Dispatch).
- **Zero Repo Pollution**: All agents, skills, hooks, and scripts run from the installed plugin root. Project repos only store `.agent-memory/` and `docs/` (created lazily on first run).
- **Zero Ad-Hoc Subagents**: Every multi-agent delegation strictly picks from the **14 Senior Experts** in `roster.json`.

## 2. Available Squad Plugins (1 Marketplace → 9 Plugins)

| Plugin ID | Senior Experts | Default |
|---|---|---|
| `saas-kit-core` | `tech-lead`, `pm`, `qa`, `security-auditor` | Enabled |
| `saas-kit-web-frontend` | `frontend`, `designer` | Disabled (enable per workspace) |
| `saas-kit-nestjs-backend` | `nestjs` | Disabled |
| `saas-kit-python-ai` | `ai-engineer`, `python-backend` | Disabled |
| `saas-kit-rust-systems` | `rustacean` | Disabled |
| `saas-kit-mobile-native` | `mobile` | Disabled |
| `saas-kit-swift-macos` | `swift-macos` | Disabled |
| `saas-kit-devops-infra` | `devops` | Disabled |
| `saas-kit-document-office` | `document-specialist` | Disabled |

## 3. 13 Lazy Playbooks (Routed via `saas-mode`)

- **Delivery**: `plan`, `build`, `review`, `ship`, `hotfix`, `meeting`, `design`, `test`, `security`
- **Parallel**: `swarm` (Roster-Locked parallel execution across installed Senior Experts)
- **Personalization & Learning**: `automate-me` (creates `~/.config/saas-kit/personal-mode.md`), `reflect`, `correct`

## 4. First-Run Model Preset Onboarding

Check if `~/.config/saas-kit/models.json` exists. If missing (or when the user asks to configure models):
1. Offer available presets from `presets/`:
   - **OpenCode (5 presets)**: `opencode`, `opencode-cc-pro`, `opencode-cc-hybrid`, `opencode-cc-deepseek`, `opencode-cc-luna`
   - **Claude Code**: `claude`
   - **Antigravity**: `antigravity`
2. Run `node <plugin_root>/scripts/configure-models.mjs --preset <selected>` (and add `--apply-opencode` for OpenCode users to merge safely into `~/.config/opencode/opencode.json`).
3. Note: Users can also override per terminal via `SAAS_KIT_PRESET=<preset-name>` or override single experts with `--set <expert>=<model>`.
