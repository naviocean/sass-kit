# PRD: OpenCode SaaS Kit v2.0 — Plugin-First Multi-Harness Architecture

> **Status**: Draft (Ready for Approval)
> **Author**: PM / Tech Lead (synthesized from `/grill-me` architecture interview & design review)
> **Created**: 2026-11-22
> **Version**: 2.0.0

---

## 1. Problem Statement

In `v1.8.0`, `opencode-saas-kit` distributes via an npm CLI (`npx opencode-saas-kit init` / `sync`) that copies `.agent-core/` (including **65 MB / ~326 skills**), `scripts/`, `opencode.json`, and `AGENTS.md` directly into every target repository, then maintains symlinks/copies across `.opencode/`, `.claude/`, and `.agents/`.

This creates four acute pain points:
1. **Target Repo Pollution**: Every consumer project carries tens of megabytes of kit internals and runner scripts in its workspace.
2. **Poor Discoverability & Update Friction**: Users cannot browse or 1-click install/update through native Marketplace flows in Claude Code, Antigravity, or OpenCode.
3. **Eager Skill Catalog Overflow**: Although skill bodies are lazy-loaded, skill metadata (`name` + `description`) is eager-loaded at turn 0. Loading ~326 leaf skills hits harness context budget limits (silently dropping skills like `shadcn` or `swift-concurrency`) and wastes 10–15k tokens per turn — even if split into 9 plugins, enabling all 9 would still overflow unless skills are consolidated into Router Skills + lazy `references/`.
4. **Orchestration Gap vs. `pstack`**: Users want `pstack`-style 2-mode ergonomics (`help` mode + `auto/orchestrate` mode + focused sub-playbooks + parallel execution), **without** `pstack`/generic swarm's weakness of spawning uncontrolled ad-hoc subagents. Multi-agent dispatch MUST strictly pick from our curated 14 Senior Experts with locked domain boundaries, pre-configured models, and sandboxed permissions.

---

## 2. Goals & Non-Goals

### In Scope (v2.0)
- **Single Marketplace Repo → 9 Squad Plugins**:
  - `saas-kit-core` (enabled by default): orchestration brain (`saas-help` + `saas-mode` skills, 13 lazy playbooks in `saas-mode/references/`, `tech-lead`, `pm`, `qa`, `security-auditor`, shared standards, multi-harness hooks, runtime scripts, MCP config, presets bundle, Roster Registry).
  - 8 Domain Squad Plugins (`web-frontend`, `nestjs-backend`, `python-ai`, `rust-systems`, `mobile-native`, `swift-macos`, `devops-infra`, `document-office`), shipping `"disabled": true` by default in `plugin.json` (enabled per workspace as needed) and containing ONLY their Senior Expert agent(s) + consolidated Router Skill(s) + lazy `references/`.
- **2-Skill Universal Entrypoint + 13 Lazy Playbooks + Optional Thin Commands**:
  - Across ALL 3 harnesses (Claude Code, Antigravity, OpenCode), the universal entrypoints are **2 top-level skills**: `saas-help` and `saas-mode`.
  - All 13 workflow playbooks live as lazy-loaded `saas-mode/references/*.md` (0 extra eager catalog slots):
    - Core workflow (10): `plan`, `build`, `review`, `ship`, `hotfix`, `meeting`, `design`, `test`, `security`, `swarm`.
    - Continuous personalization & learning (3): `automate-me` (mines recent transcripts + short interview to generate `~/.config/saas-kit/personal-mode.md`, auto-loaded by `saas-mode` without mutating plugin files), `reflect` (post-session root-cause & lesson distillation into `experience-library.mjs` + ICM), and `correct` (mid-session immediate fix + structural lesson capture into `experience-library.mjs` + ICM).
  - For Claude Code & OpenCode, `build-plugins.mjs` also generates thin `commands/*.md` wrappers pointing to the corresponding playbook for deterministic slash invocation.
- **Anti-Overflow Skill Architecture ("Router Skill + Lazy `references/`")**:
  - Instead of exposing ~326 leaf `SKILL.md` files into the eager metadata catalog, each Squad Plugin exposes **1–2 Router Skills** (e.g., `nestjs-expert/SKILL.md`, `rustacean-expert/SKILL.md`) whose `references/` directory holds the 10–30 deep topic guides.
  - Even if a user enables **all 9 plugins simultaneously**, total eager skill catalog entries stay at **~15–18 skills** (~90% turn-0 token reduction, zero truncation).
- **Roster-Locked Parallel Dispatch (`/saas-mode` auto-parallel + `/saas-swarm` explicit parallel)**:
  - Default `/saas-mode`: `pm` handles sequential spec/PRD, then `tech-lead` automatically fans out independent domain tasks in parallel across installed Senior Experts (`frontend` + `nestjs` + `devops`, etc.), followed by `qa` & `security-auditor`.
  - Explicit `/saas-swarm` (`saas-mode/references/swarm.md`): allows immediate multi-expert parallel execution (e.g., concurrent refactor + security audit + E2E test) while strictly enforcing **Zero Ad-Hoc Subagents**: every worker MUST map to an installed Senior Expert in `roster.json`; missing squad → halt and print exact 1-line install command.
- **Native Multi-Harness Support (Plugin-First)**:
  - **Claude Code**: root `.claude-plugin/marketplace.json` + per-plugin `.claude-plugin/plugin.json`, `agents/*.md` (with built-in `model` frontmatter), thin `commands/*.md`, Router `skills/`, `hooks/hooks.json`, `.mcp.json`.
  - **Antigravity**: root `.agents/plugins/marketplace.json` + per-plugin `plugin.json`, `rules/AGENTS.md`, Router `skills/`, native sandboxed `subagents/<name>.json` (DAG rule `enableSubagentTools: false` for all 13 non-orchestrators, least-privilege `enableWriteTools`, `workspace: "branch"` isolation, built-in `model` tier), root `hooks.json` (Antigravity native schema), `mcp_config.json`.
  - **OpenCode**: per-plugin `package.json` + `index.mjs` implementing `@opencode-ai/plugin` hooks (`tool.execute.before`, `permission.ask`) + OpenCode-discoverable `agents/`, `commands/`, `skills/`.
- **Built-in Default Models + Dynamic Multi-Preset Resolution (5 OpenCode Presets)**:
  - Claude Code (`agents/*.md`) and Antigravity (`subagents/*.json`) ship with built-in default model tiers from `.agent-core/presets/`.
  - All 5 OpenCode presets (`opencode`, `opencode-cc-pro`, `opencode-cc-hybrid`, `opencode-cc-deepseek`, `opencode-cc-luna`) + Claude/Antigravity presets are bundled in `plugins/saas-kit-core/presets/`.
  - OpenCode resolves active preset dynamically with zero plugin-file mutation: `SAAS_KIT_PRESET` env var → `~/.config/saas-kit/models.json` (with per-agent overrides) → session model fallback. First-run `/saas-help` or `/saas-mode` offers 1-step interactive preset selection via `configure-models.mjs`.
- **Zero-Pollution Target Repos**:
  - All runtime scripts & hooks execute from plugin root (`PLUGIN_ROOT` / `${CLAUDE_PLUGIN_ROOT}` / package dir).
  - Project-scoped state (`.agent-memory/`, `docs/prds/`, `docs/plans/`, `docs/adr/`, `_workspace/`) is created lazily on first command execution.
- **Authoring SSoT + Compiler & Clean v2.0 Cutover**:
  - Keep `.agent-core/` as authoring SSoT; replace `scripts/sync-kit.mjs` with `scripts/build-plugins.mjs`.
  - Remove legacy CLI `init`/`sync`/`pack` (`bin/cli.js`, `scripts/sync-kit.mjs`, `scripts/skill-pack-manager.mjs`, `scripts/lib/context-marker.cjs`) and their obsolete tests.

### Out of Scope (v2.0 — Deferred to v2.1)
- Backward compatibility with v1.x `npx opencode-saas-kit init` / `sync` / `pack` commands (clean v2.0 break by explicit user decision).
- Dedicated Codex-specific plugin runtime beyond standard `.agents/plugins/marketplace.json` compatibility.
- Splitting the repository into separate per-harness Git repositories.
- Secondary `pstack`-style convenience playbooks (`babysit`/`fix-ci`, `unslop`/`make-pr-easy-to-review`, `ketchup`) — explicitly deferred to **v2.1** to keep v2.0 focused and fast to ship.

---

## 3. User Stories

1. **As a developer using Claude Code / Antigravity / OpenCode**, I want to add 1 Marketplace (`naviocean/opencode-saas-kit`) and install `saas-kit-core` plus any needed squads without polluting my repo or overflowing the skill catalog — even if I enable all 9 squads at once.
2. **As a developer starting a session**, I want to invoke `saas-help` to see workflows, installed vs available squads, and pick my OpenCode/Claude/Antigravity model preset in one step.
3. **As a developer running `saas-mode` or `saas-swarm`**, I want parallel multi-agent execution that strictly dispatches to pre-defined Senior Experts (with built-in models, DAG loop protection, read-only audit sandboxes, and branch isolation), never inventing ad-hoc custom workers.
4. **As an OpenCode user switching between `opencode-go` and `commandcode` providers**, I want to switch between the 5 built-in presets via `SAAS_KIT_PRESET` or `configure-models.mjs --preset <name>` without mutating installed plugin files.
5. **As the kit maintainer**, I want to author once in `.agent-core/` and run `npm run build:plugins && npm run test:all` to deterministically emit and validate all 9 multi-harness plugins.

---

## 4. Acceptance Criteria

- [ ] **AC-1 (Marketplace & 9 Plugins Built Deterministically)**: `npm run build:plugins` generates `plugins/saas-kit-core/` and all 8 domain squad plugins under `plugins/saas-kit-<squad>/`, plus `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`.
- [ ] **AC-2 (Catalog Budget Immunity — ≤ 20 Eager Skills Across All 9 Plugins)**: Consolidated Router Skills + lazy `references/` keeps total eager `SKILL.md` entries across ALL 9 plugins combined at **≤ 20** (down from ~326), with zero duplicate skill names across plugins. Domain squad plugins ship with `"disabled": true` by default in `plugin.json`.
- [ ] **AC-3 (Multi-Harness Manifest & Subagent Parity)**:
  - Claude Code: `.claude-plugin/plugin.json`, `agents/*.md` (with `model` frontmatter), thin `commands/*.md`, Router `skills/`, `hooks/hooks.json`, `.mcp.json`.
  - Antigravity: `plugin.json`, root `hooks.json` (Antigravity native schema), `rules/AGENTS.md`, Router `skills/`, native sandboxed `subagents/<name>.json` (verified DAG `enableSubagentTools: false` on all 13 non-orchestrators, `enableWriteTools: false` on `security-auditor`, `workspace: "branch"` on parallel builders, built-in `model` tier), `mcp_config.json`.
  - OpenCode: `package.json` + `index.mjs` wiring `pre-tool-guard` to `tool.execute.before` and `permission.ask`, plus dynamic preset resolution (`SAAS_KIT_PRESET` → `~/.config/saas-kit/models.json` → session fallback).
- [ ] **AC-4 (2-Mode UX + Personalization/Learning + Roster-Locked Parallel Dispatch)**:
  - `saas-help` and `saas-mode` skills exist in `saas-kit-core/skills/`, with all 13 playbooks (`plan`, `build`, `review`, `ship`, `hotfix`, `meeting`, `design`, `test`, `security`, `swarm`, `automate-me`, `reflect`, `correct`) in `saas-mode/references/`.
  - `automate-me` generates/updates `~/.config/saas-kit/personal-mode.md` (auto-read by `saas-mode` when present); `reflect` and `correct` wire directly into `scripts/experience-library.mjs` and ICM.
  - `roster.json` maps all 14 Senior Experts → squad plugin ID, domain ownership, sandbox flags, model tier, trigger keywords, and install commands.
  - Orchestrator rules + `tech-lead.md` + `swarm.md` strictly forbid ad-hoc subagent creation and halt with exact squad install instructions if an expert is missing.
- [ ] **AC-5 (Zero-Pollution Runtime & Dynamic Presets)**:
  - `pre-tool-guard.mjs` passes Claude Code, Antigravity (camelCase stdin → `{ decision, reason }`), and OpenCode programmatic hook tests.
  - Zero `.opencode/agent-registry.json` or `.opencode/standards/` hardcoded paths remain in `.agent-core/agents/` or `.agent-core/commands/`.
  - `scripts/configure-models.mjs` supports all 5 OpenCode presets + Claude/Antigravity presets + per-agent `--set` overrides + `--apply-opencode`, persisting exclusively to `~/.config/saas-kit/models.json`.
- [ ] **AC-6 (Clean v2.0 Cutover & Green Suite)**:
  - Legacy `bin/cli.js`, `scripts/sync-kit.mjs`, `scripts/skill-pack-manager.mjs`, `scripts/lib/context-marker.cjs`, `scripts/verify.mjs` and their obsolete test files are removed.
  - `npm run test:all` (unit tests + plugin build/verify + harness evals + AgentShield security gate) passes 100% green.
