# Implementation Plan: OpenCode SaaS Kit v2.0 (Plugin-First Multi-Harness Architecture)

> **Status**: Draft (Ready for Approval)
> **Author**: Tech Lead Agent
> **Created**: 2026-11-22
> **Version**: 2.0.0
> **PRD**: [plugin-first-v2-prd.md](../prds/plugin-first-v2-prd.md)

---

## 1. Summary

We will migrate `opencode-saas-kit` directly from `v1.8.0` (monolithic CLI copy/symlink) to **`v2.0.0` (Plugin-First Multi-Harness Marketplace)** targeting **Claude Code, Antigravity, and OpenCode**. `.agent-core/` remains the single authoring source of truth, compiled by `scripts/build-plugins.mjs` into **1 Marketplace Repo containing 9 Squad Plugins** (`saas-kit-core` + 8 domain squads).

Key architectural pillars finalized in design review:
1. **2-Skill Universal Entrypoint + Learning Loop**: `saas-help` and `saas-mode` skills across all 3 harnesses, with **13 lazy-loaded playbooks** in `saas-mode/references/` (10 core workflows: `plan`, `build`, `review`, `ship`, `hotfix`, `meeting`, `design`, `test`, `security`, `swarm` + 3 learning/personalization playbooks: `automate-me` writing `~/.config/saas-kit/personal-mode.md`, plus `reflect` & `correct` wired to `experience-library.mjs` + ICM), plus thin `commands/*.md` wrappers for Claude Code / OpenCode. (`babysit`, `unslop`, `ketchup` deferred to v2.1.)
2. **Router Skill + Lazy `references/` (Anti-Overflow)**: Consolidate ~326 leaf skills into **~15–18 Router Skills total across all 9 plugins** (each Router Skill holds its deep guides in `references/`), so even enabling all 9 plugins simultaneously never triggers eager skill catalog truncation. Domain squad plugins ship with `"disabled": true` by default in `plugin.json`.
3. **Native Sandboxed Subagents (`subagents/<name>.json`)**: Compile all 14 Senior Experts into Antigravity native JSON subagents (enforcing DAG `enableSubagentTools: false` on non-orchestrators, read-only `enableWriteTools: false` on `security-auditor`, `workspace: "branch"` isolation on parallel builders, and built-in `model` tiers) alongside Claude Code/OpenCode `agents/<name>.md`.
4. **Roster-Locked Parallel Dispatch**: Automatic parallel fan-out via `tech-lead` in `/saas-mode` plus explicit `/saas-swarm` (`saas-mode/references/swarm.md`) — strictly locked to installed Senior Experts in `roster.json` (zero ad-hoc subagents).
5. **Dynamic Multi-Preset Resolution**: Bundle all presets (including all 5 OpenCode presets: `opencode`, `opencode-cc-pro`, `opencode-cc-hybrid`, `opencode-cc-deepseek`, `opencode-cc-luna`) inside `saas-kit-core/presets/`, resolved dynamically via `SAAS_KIT_PRESET` → `~/.config/saas-kit/models.json` → session fallback without mutating plugin files.

---

## 2. Target Architecture & Directory Layout

### 2.1 Repository Layout (v2.0)

```text
opencode-saas-kit/
├── .claude-plugin/
│   └── marketplace.json               # Claude Code Marketplace catalog (9 plugins)
├── .agents/
│   └── plugins/
│       └── marketplace.json           # Antigravity / Codex Marketplace catalog (9 plugins)
├── .agent-core/                       # SINGLE SOURCE OF TRUTH (authoring only)
│   ├── agents/                        # 14 Senior Expert definitions (harness-neutral)
│   ├── commands/                      # 13 workflow playbooks (plan, build, review, ship, hotfix, meeting, design, test, security, swarm, automate-me, reflect, correct)
│   ├── hooks/                         # pre-tool-guard.mjs (multi-harness stdin/stdout adapter)
│   ├── presets/                       # All model presets (claude, antigravity, 5x opencode)
│   ├── rules/                         # Core workflow rules + roster-guard.md
│   ├── skills/                        # Source ~326 skills (compiled into Router Skills + lazy references/)
│   ├── standards/                     # conventions.md, engineering-principles.md, templates
│   ├── roster.json                    # NEW: Canonical 14-expert Roster, sandbox flags, model tiers & Squad mapping
│   └── skill-packs.json               # Updated: Deduplicated Squad -> Router Skill & reference mapping
├── plugins/                           # GENERATED OUTPUT by scripts/build-plugins.mjs
│   ├── saas-kit-core/                 # Enabled by default
│   │   ├── .claude-plugin/plugin.json # Claude Code manifest
│   │   ├── plugin.json                # Antigravity native manifest (enabled: true)
│   │   ├── package.json               # OpenCode npm plugin manifest
│   │   ├── index.mjs                  # OpenCode @opencode-ai/plugin entrypoint + dynamic preset loader
│   │   ├── hooks.json                 # Antigravity native hook (strictly at plugin root!)
│   │   ├── hooks/
│   │   │   ├── hooks.json             # Claude Code hook (${CLAUDE_PLUGIN_ROOT})
│   │   │   └── pre-tool-guard.mjs
│   │   ├── .mcp.json                  # Claude Code MCP config
│   │   ├── mcp_config.json            # Antigravity MCP config
│   │   ├── rules/AGENTS.md            # Antigravity consolidated rules + Roster Guard
│   │   ├── agents/                    # Claude Code & OpenCode .md agents (tech-lead, pm, qa, security-auditor)
│   │   ├── subagents/                 # Antigravity native JSON subagents (tech-lead.json, pm.json, qa.json, security-auditor.json)
│   │   ├── commands/                  # Thin slash wrappers for Claude Code & OpenCode (saas-help, saas-mode, saas-swarm, plan, build, ...)
│   │   ├── skills/
│   │   │   ├── saas-help/SKILL.md     # Interactive guide, squad status & 1-step preset onboarding
│   │   │   ├── saas-mode/
│   │   │   │   ├── SKILL.md           # Autonomous orchestration mode + Roster-Locked Parallel Dispatch
│   │   │   │   └── references/        # 13 lazy playbooks (plan, build, review, ship, hotfix, meeting, design, test, security, swarm, automate-me, reflect, correct)
│   │   │   ├── core-engineering/      # Router Skill for shared standards/gitnexus/TDD/security
│   │   │   │   ├── SKILL.md
│   │   │   │   └── references/        # Lazy-loaded core/shared skill guides
│   │   │   └── qa-security-expert/    # Router Skill for QA verification, forensics & security audit
│   │   │       ├── SKILL.md
│   │   │       └── references/
│   │   ├── presets/                   # Bundled model presets (5x opencode, claude, antigravity)
│   │   ├── standards/                 # Shared standards & templates
│   │   └── scripts/                   # security-gate.mjs, repo-scanner.mjs, triage-sizer.mjs, configure-models.mjs, roster.json
│   ├── saas-kit-web-frontend/         # plugin.json ("disabled": true), agents/ & subagents/ (frontend, designer), 2 Router Skills + references/
│   ├── saas-kit-nestjs-backend/       # plugin.json ("disabled": true), nestjs, 1 Router Skill + references/
│   ├── saas-kit-python-ai/            # plugin.json ("disabled": true), ai-engineer + python-backend, 2 Router Skills + references/
│   ├── saas-kit-rust-systems/         # plugin.json ("disabled": true), rustacean, 1 Router Skill + references/
│   ├── saas-kit-mobile-native/        # plugin.json ("disabled": true), mobile, 1 Router Skill + references/
│   ├── saas-kit-swift-macos/          # plugin.json ("disabled": true), swift-macos, 1 Router Skill + references/
│   ├── saas-kit-devops-infra/         # plugin.json ("disabled": true), devops, 1 Router Skill + references/
│   └── saas-kit-document-office/      # plugin.json ("disabled": true), document-specialist, 1 Router Skill + references/
├── scripts/
│   ├── build-plugins.mjs              # NEW: SSoT -> 9 multi-harness plugins compiler
│   ├── configure-models.mjs           # NEW: External ~/.config/saas-kit/models.json & multi-preset manager
│   ├── verify-plugins.mjs             # NEW: Validates all 9 plugins, catalog budget (<=20), subagent DAG & marketplace manifests
│   ├── security-gate.mjs              # Kept (bundled into saas-kit-core/scripts/)
│   ├── repo-scanner.mjs               # Kept (bundled into saas-kit-core/scripts/)
│   ├── triage-sizer.mjs               # Kept (bundled into saas-kit-core/scripts/)
│   ├── dispatch.mjs                   # Updated: Roster-strict dispatch validator
│   ├── eval-harness.mjs               # Kept
│   ├── harness-state.mjs              # Kept
│   ├── harness-surface.mjs            # Updated: Plugin-first surface checks
│   ├── experience-library.mjs         # Kept
│   ├── propose-probe-compose.mjs      # Kept
│   ├── skill-registry.mjs             # Updated: Reads from .agent-core/skill-packs.json & roster.json
│   └── __tests__/                     # Updated test suite
└── package.json                       # v2.0.0 scripts (build:plugins, verify:plugins, test:all)
```

### 2.2 Eager Skill Catalog Budget Proof (All 9 Plugins Enabled Simultaneously)

| Plugin | Router Skills Exposed in Eager Catalog | Deep Guides Lazy-Loaded via `references/` |
|---|---|---|
| `saas-kit-core` | 4 (`saas-help`, `saas-mode`, `core-engineering`, `qa-security-expert`) | 13 playbooks + ~75 shared/core skill guides |
| `saas-kit-web-frontend` | 2 (`frontend-expert`, `designer-expert`) | ~28 exclusive frontend/UI guides |
| `saas-kit-nestjs-backend` | 1 (`nestjs-expert`) | ~11 exclusive NestJS/Prisma/PG guides |
| `saas-kit-python-ai` | 2 (`ai-engineer-expert`, `python-backend-expert`) | ~29 exclusive Python/LangGraph/FastAPI guides |
| `saas-kit-rust-systems` | 1 (`rustacean-expert`) | ~10 exclusive Rust/Axum/Tauri guides |
| `saas-kit-mobile-native` | 1 (`mobile-expert`) | ~10 exclusive React Native/iOS/Android guides |
| `saas-kit-swift-macos` | 1 (`swift-macos-expert`) | ~15 exclusive Swift/macOS guides |
| `saas-kit-devops-infra` | 1 (`devops-expert`) | ~13 exclusive CI/CD/K8s/Terraform guides |
| `saas-kit-document-office` | 1 (`document-specialist-expert`) | ~6 exclusive Office/PDF/LaTeX guides |
| **TOTAL (All 9 Active)** | **14 eager skills** (down from ~326!) | **100% truly lazy-loaded** |

### 2.3 Multi-Harness Manifest & Runtime Contracts

1. **Claude Code** (`.claude-plugin/plugin.json` + `hooks/hooks.json` + `.claude-plugin/marketplace.json`):
   - `hooks/hooks.json` invokes `node "${CLAUDE_PLUGIN_ROOT}/hooks/pre-tool-guard.mjs" --harness claude`.
   - `agents/<name>.md` frontmatter embeds default `model` from `.agent-core/presets/agent-models-claude.json` (`opus` / `sonnet` / `haiku` / `inherit`).
   - Thin `commands/*.md` wrap `saas-help`, `saas-mode`, `saas-swarm`, and the 9 workflow playbooks.
   - `marketplace.json` lists all 9 plugins with `"source": "./plugins/saas-kit-<name>"`.

2. **Antigravity** (`plugin.json` + root `hooks.json` + `rules/AGENTS.md` + `subagents/<name>.json` + `.agents/plugins/marketplace.json`):
   - Native `hooks.json` placed directly at `<plugin_dir>/hooks.json`:
     `{ "agentshield-pre-tool-guard": { "PreToolUse": [{ "matcher": "run_command|write_file|edit_file", "hooks": [{ "type": "command", "command": "node ./hooks/pre-tool-guard.mjs --harness antigravity", "timeout": 10 }] }] } }`.
   - Reads camelCase `toolCall.name` / `toolCall.args` from stdin and outputs `{ "decision": "allow" | "deny", "reason": "..." }` to stdout.
   - **Native Sandboxed Subagents (`subagents/<name>.json`)** compiled from `.agent-core/agents/<name>.md` + `roster.json` + `agent-models-antigravity.json`:
     ```json
     {
       "name": "nestjs",
       "role": "Senior NestJS & Prisma Backend Engineer",
       "description": "...",
       "model": "flash",
       "workspace": "branch",
       "enableWriteTools": true,
       "enableSubagentTools": false,
       "enableMCPTools": true,
       "systemPrompt": "..."
     }
     ```
     - **DAG Enforcement**: `"enableSubagentTools": false` on all 13 non-orchestrator experts (only `tech-lead` / root coordinator spawns delegates).
     - **Least-Privilege Sandboxing**: `"enableWriteTools": false` on `security-auditor`; `"workspace": "branch"` on parallel implementation experts (`frontend`, `nestjs`, `rustacean`, `mobile`, `swift-macos`, `python-backend`, `ai-engineer`, `devops`, `document-specialist`).
   - 8 domain squad plugins declare `"disabled": true` in `plugin.json` so global installs stay 0-token until enabled per workspace.

3. **OpenCode** (`package.json` + `index.mjs` inside `plugins/saas-kit-core/`):
   - Exports `SaasKitCorePlugin` implementing `@opencode-ai/plugin` lifecycle hooks:
     - `'tool.execute.before'` → runs `evaluateToolCall()` from `./hooks/pre-tool-guard.mjs` and throws on block.
     - `'permission.ask'` → denies `.env` / private key edits via `out.status = 'deny'`.
   - **Dynamic Multi-Preset Resolution** (for `opencode`, `opencode-cc-pro`, `opencode-cc-hybrid`, `opencode-cc-deepseek`, `opencode-cc-luna`):
     1. `process.env.SAAS_KIT_PRESET` (per-terminal/project override)
     2. `~/.config/saas-kit/models.json` (`preset` + per-agent `overrides`)
     3. Session model fallback (never hardcodes a provider key that the user may not have authenticated)
   - `configure-models.mjs --preset <name> --apply-opencode` cleanly merges the resolved `"agent"` model map into `~/.config/opencode/opencode.json` without mutating plugin files.

---

## 3. Implementation Phases

### Phase 1: Roster Registry, Router-Skill Consolidation & 2-Mode UX (SSoT)

**Goal**: Define the canonical 14-expert Roster, deduplicate & map skills into 14 Router Skills + lazy `references/`, neutralize legacy `.opencode/` path references, and author `saas-help`, `saas-mode`, `swarm.md`, and `roster-guard.md`.

| Task | Owner | Dependencies | Estimate |
|---|---|---|---|
| T-101: Create `.agent-core/roster.json` mapping all 14 Senior Experts → squad plugin ID (`saas-kit-*`), `role`, `ownedPaths`, `sandbox` (`enableWriteTools`, `enableSubagentTools`, `enableMCPTools`, `workspace`), `routerSkill`, trigger keywords, and install commands for Claude Code / Antigravity / OpenCode | Tech Lead | None | 1.5h |
| T-102: Audit 65 MB `.agent-core/skills/` for oversized assets/bloat AND update `.agent-core/skill-packs.json` so shared skills (used by ≥2 packs) belong exclusively to `core`, and every pack maps cleanly to its 1–2 Router Skills + `references/` list | Tech Lead | T-101 | 1.5h |
| T-103: Add `.agent-core/rules/roster-guard.md` enforcing **Zero Ad-Hoc Subagents** + **Roster-Locked Parallel Dispatch** (must map every task to an installed expert in `roster.json`; missing squad → halt and print exact 1-line install command; enforce domain ownership locks) | Tech Lead | T-101 | 1h |
| T-104: Author `.agent-core/commands/swarm.md` (explicit `/saas-swarm` Roster-Locked parallel execution playbook) AND learning/personalization playbooks `.agent-core/commands/automate-me.md` (mines transcripts → `~/.config/saas-kit/personal-mode.md`), `reflect.md`, and `correct.md` (wired to `experience-library.mjs` + ICM) | Tech Lead | T-103 | 2h |
| T-105: Author `saas-help` and `saas-mode` templates in `.agent-core/skills/saas-help/SKILL.md` and `.agent-core/skills/saas-mode/SKILL.md` (interactive guide, 1-step preset onboarding via `configure-models.mjs`, auto-loading `~/.config/saas-kit/personal-mode.md` if present, Adaptive Socratic Sizing S/M/L, lazy `.agent-memory/` & `docs/` bootstrap, automatic parallel dispatch via `pm` → `tech-lead`, and routing to all 13 lazy playbooks) | Tech Lead | T-103, T-104 | 2h |
| T-106: Neutralize hardcoded `.opencode/agent-registry.json` and `.opencode/standards/` paths across all 14 `.agent-core/agents/*.md` and 9 existing `.agent-core/commands/*.md` to plugin-relative / harness-agnostic references | Tech Lead | T-101 | 2h |
| T-107: Write unit tests `scripts/__tests__/roster.test.mjs` verifying all 14 experts exist, every skill belongs to exactly 1 plugin (zero duplicates), total Router Skills across all 9 plugins ≤ 20, and zero `.opencode/` hardcoded paths remain in `.agent-core/agents/` | QA | T-101..T-106 | 1h |

**Deliverable**: Clean, deduplicated `.agent-core/` SSoT with 2-mode UX, Roster-Locked `/saas-swarm`, and ≤ 20 Router Skills.

---

### Phase 2: Multi-Harness Hook Adapter & Dynamic Multi-Preset Model Manager

**Goal**: Make runtime hooks and multi-preset model configuration 100% plugin-root portable with zero repo pollution.

| Task | Owner | Dependencies | Estimate |
|---|---|---|---|
| T-201: Write failing tests in `scripts/__tests__/pre-tool-guard.test.mjs` for `--harness antigravity` (stdin camelCase `toolCall`, stdout `{ decision: "allow"|"deny", reason }`), `--harness claude` (stdin `tool_name`/`tool_input`, exit code 2 / JSON deny), and programmatic JS export `evaluateToolCall()` for OpenCode | QA | None | 1h |
| T-202: Upgrade `.agent-core/hooks/pre-tool-guard.mjs` to pass all 3 harness contracts while keeping existing security rules (blocked credential files, destructive shell commands, force-push main/master, `--no-verify`) | Security / Tech Lead | T-201 | 1.5h |
| T-203: Write failing tests `scripts/__tests__/configure-models.test.mjs` testing: (a) preset resolution order (`SAAS_KIT_PRESET` → `~/.config/saas-kit/models.json` → session fallback), (b) all 5 OpenCode presets + Claude/Antigravity presets, (c) per-agent `--set <agent>=<model>` overrides, (d) `--apply-opencode` safe JSON merge into temp `opencode.json` without mutating plugin files | QA | None | 1.5h |
| T-204: Implement `scripts/configure-models.mjs` supporting `--list-presets`, `--preset <name>`, `--set <agent>=<model>`, `--apply-opencode`, and `--show`, persisting exclusively to `~/.config/saas-kit/models.json` | Tech Lead | T-203 | 2h |

**Deliverable**: Portable multi-harness runtime guard and dynamic multi-preset model config manager with passing unit tests.

---

### Phase 3: Plugin Compiler (`build-plugins.mjs`) & Marketplace Validator

**Goal**: Build deterministic compiler turning `.agent-core/` into all 9 multi-harness plugins + root marketplace catalogs.

| Task | Owner | Dependencies | Estimate |
|---|---|---|---|
| T-301: Write failing tests `scripts/__tests__/build-plugins.test.mjs` asserting: (a) all 9 `plugins/saas-kit-*` directories created, (b) valid `.claude-plugin/plugin.json`, `plugin.json` (`disabled: true` on 8 domain squads, enabled on `core`), `package.json`, `index.mjs` generated, (c) root `hooks.json` (Antigravity) AND `hooks/hooks.json` (Claude Code) exist in `saas-kit-core`, (d) native Antigravity `subagents/<name>.json` generated for all 14 experts with valid schema (`name`, `role`, `model`, `workspace`, `enableWriteTools`, `enableSubagentTools: false` for all 13 non-orchestrators, `enableMCPTools`, `systemPrompt`), (e) total eager `SKILL.md` across all 9 plugins ≤ 20 and all 13 playbooks (`plan`, `build`, `review`, `ship`, `hotfix`, `meeting`, `design`, `test`, `security`, `swarm`, `automate-me`, `reflect`, `correct`) exist in `saas-mode/references/`, (f) `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` list all 9 plugins with valid relative paths, (g) `--check` drift detection fails when output is stale | QA | Phase 1, Phase 2 | 2.5h |
| T-302: Implement `scripts/build-plugins.mjs` with `--clean`, `--only <squad>`, and `--check` flags: compiles Router Skills + lazy `references/`, all 13 playbooks into `saas-mode/references/` + thin Claude/OpenCode `commands/`, agents (Markdown with built-in models for Claude/OpenCode + sandboxed JSON `subagents/<name>.json` for Antigravity), presets bundle, hooks, MCP configs (`.mcp.json` & `mcp_config.json`), OpenCode `index.mjs` wrapper, and both root `marketplace.json` files | Tech Lead | T-301 | 4h |
| T-303: Implement `scripts/verify-plugins.mjs` validating schema compliance across all 9 generated plugins (manifest required fields, JSON syntax, eager skill catalog count ≤ 20, `subagents/*.json` DAG & sandbox schema, hook script executability, zero duplicate skills, zero broken references) | QA | T-302 | 1.5h |
| T-304: Update `scripts/dispatch.mjs` and `scripts/harness-surface.mjs` to validate Roster-Locked dispatch and plugin-first layout (`plugins/saas-kit-core/`) | Tech Lead | T-302 | 1.5h |

**Deliverable**: `npm run build:plugins` and `npm run verify:plugins` deterministically generate and validate all 9 multi-harness plugins.

---

### Phase 4: Clean v2.0 Cutover (Remove Legacy CLI & Obsolete Tests)

**Goal**: Tag `v1.8.0`, remove deprecated CLI `init`/`sync`/`pack` scaffolding, and update `package.json`, CI, and docs for `v2.0.0`.

| Task | Owner | Dependencies | Estimate |
|---|---|---|---|
| T-401: Tag pre-migration commit `v1.8.0`, then remove legacy files: `bin/cli.js`, `scripts/sync-kit.mjs`, `scripts/skill-pack-manager.mjs`, `scripts/lib/context-marker.cjs`, `scripts/verify.mjs` and obsolete tests: `scripts/__tests__/cli.test.mjs`, `scripts/__tests__/sync-kit.test.mjs`, `scripts/__tests__/skill-pack-manager.test.mjs`, `scripts/__tests__/context-marker.test.mjs`, `scripts/__tests__/verify.test.mjs` | Tech Lead | Phase 3 passing | 1h |
| T-402: Update `package.json` to `"version": "2.0.0"`: remove `"bin"`, update `"files"` to include `.claude-plugin/`, `.agents/plugins/`, `plugins/`, update `"scripts"` (`build:plugins`, `verify:plugins`, `configure:models`, `test`, `test:all`) | Tech Lead | T-401 | 0.5h |
| T-403: Update `.github/workflows/` CI to run `npm run build:plugins -- --check`, `npm run test:all`, and `node scripts/security-gate.mjs` | DevOps / Tech Lead | T-402 | 1h |
| T-404: Rewrite `README.md` and `AGENTS.md` for v2.0.0: document 1-click Marketplace install commands for Claude Code, Antigravity, and OpenCode, `saas-help` / `saas-mode` / `saas-swarm` quickstart, 9 Squad Plugins table, Router Skill catalog architecture, and multi-preset `configure-models.mjs` usage | Tech Lead | T-402 | 1.5h |
| T-405: Run full verification gate: `npm run build:plugins && npm run test:all` + `node scripts/security-gate.mjs` + `claude plugin validate ./plugins/saas-kit-core` (if CLI present) + smoke-test OpenCode `index.mjs` import | QA + Security | T-401..T-404 | 1.5h |

**Deliverable**: Clean, verified `v2.0.0` Plugin-First release with 0 failing tests and passing security gate.

---

## 4. Parallel Execution Map

```text
Phase 1: [T-101 → T-102, T-103, T-106 (parallel)] → [T-104 → T-105] → [T-107]
Phase 2: [T-201 → T-202]  ||  [T-203 → T-204]   (runs in parallel with Phase 1!)
Phase 3: [T-301 → T-302] → [T-303 || T-304]
Phase 4: [T-401 → T-402] → [T-403 || T-404] → [T-405]
```

---

## 5. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **OpenCode plugin API drift** (`@opencode-ai/plugin` vs declarative agents/commands loading) | Medium | High | Keep OpenCode `index.mjs` zero-dependency (plain ESM factory returning hook map `{ 'tool.execute.before', 'permission.ask' }`) and provide `configure-models.mjs --apply-opencode` for safe `opencode.json` agent model mapping. |
| **Antigravity root `hooks.json` vs Claude Code `hooks/hooks.json` mismatch** | High (if unaddressed) | High | Emit BOTH formats in `build-plugins.mjs`: native Antigravity `hooks.json` at `<plugin_dir>/hooks.json` AND Claude Code `hooks/hooks.json` using `${CLAUDE_PLUGIN_ROOT}`. Enforce in `verify-plugins.mjs`. |
| **Context budget overflow when all 9 squads are enabled** | Solved by design | High | Router Skill + lazy `references/` caps total eager skills across all 9 plugins at **14** (≤ 20 assertion in `verify-plugins.mjs`), plus `"disabled": true` default on the 8 domain squads. |
| **Repo size bloat if `plugins/` copies 65 MB of skills into Git** | High | Medium | Audit `.agent-core/skills/` in `T-102` to find and remove/exclude oversized binary fixtures or `node_modules` before compiling `plugins/`. |
| **Existing tests referencing `.opencode/` or `sync-kit.mjs`** (`eval-harness.test.mjs`, `agent-skills-audit.test.mjs`, `gitnexus-contract.test.mjs`) | Medium | Medium | Audit and update all remaining kept tests in `T-304` and `T-401` so every test targets `.agent-core/` or `plugins/`. |

---

## 6. Definition of Done

- [ ] `docs/prds/plugin-first-v2-prd.md` and `docs/plans/2026-11-22-plugin-first-v2-plan.md` approved by user.
- [ ] All 9 plugins compile cleanly via `npm run build:plugins` with **≤ 20 total eager skills** and 0 duplicate skills across plugins.
- [ ] `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` list all 9 plugins accurately.
- [ ] `saas-help`, `saas-mode`, and `saas-mode/references/swarm.md` implemented with strict Roster-Locked Parallel Dispatch (zero ad-hoc subagent creation).
- [ ] Native Antigravity `subagents/<name>.json` generated for all 14 experts with DAG & least-privilege sandboxing verified.
- [ ] `pre-tool-guard.mjs` passes Claude Code, Antigravity, and OpenCode hook contract tests.
- [ ] `configure-models.mjs` resolves all 5 OpenCode presets + Claude/Antigravity presets dynamically (`SAAS_KIT_PRESET` → `~/.config/saas-kit/models.json` → session fallback).
- [ ] Legacy CLI (`bin/cli.js`, `scripts/sync-kit.mjs`, `scripts/skill-pack-manager.mjs`, `scripts/verify.mjs`) removed.
- [ ] `npm run test:all` and AgentShield `security-gate.mjs` pass 100% green.
- [ ] `README.md` and `AGENTS.md` updated to `v2.0.0`.

---

## 7. Rollback Plan

1. Tag the final pre-migration commit as `v1.8.0` before starting Phase 4 deletion (`T-401`).
2. Execute all v2.0 work on branch `feat/plugin-first-v2` so `main` remains untouched until `T-405` passes completely.
3. If any harness breaks after release, users can pin `v1.8.0` via `npx opencode-saas-kit@1.8.0` while hotfixing `v2.0.x`.

---

## 8. Execution Handoff

Once you approve this plan, choose your preferred execution mode:
1. **Subagent-Driven (Recommended)** — Fresh specialist subagent per phase/task with verification checkpoints after each phase.
2. **Inline Execution** — Execute step-by-step in this session, pausing at each phase boundary for review.
