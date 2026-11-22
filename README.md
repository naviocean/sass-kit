# SaaS Kit v2.0

**Plugin-First Multi-Harness Marketplace** for **Claude Code**, **Antigravity**, and **OpenCode** — 14 curated Senior Experts packaged across **9 modular Squad Plugins** with zero target-repo pollution, **Roster-Locked Parallel Dispatch**, and **≤ 20 eager skills** even when all 9 squads are enabled simultaneously.

---

## Why v2.0 (Plugin-First)?

- **Zero Repo Pollution**: No more copying `.agent-core/` or `scripts/` into consumer projects. Agents, skills, hooks, and scripts run directly from the installed plugin root; target repos only create `.agent-memory/` and `docs/` lazily on first use.
- **Anti-Overflow Router Skills (14 Eager Skills Total)**: Instead of dumping ~326 leaf `SKILL.md` entries into the turn-0 prompt catalog, each squad exposes **1–2 Router Skills** backed by lazy `references/*.md` guides (~8.6 MB (including 16 bundled helper script suites) total across all 9 compiled plugins).
- **2-Mode UX + 13 Lazy Playbooks**:
  - `saas-help`: Interactive guide, squad status checker, and 1-step model preset onboarding.
  - `saas-mode`: Autonomous orchestration mode (Adaptive Socratic Sizing S/M/L) routing lazily to 13 playbooks (`plan`, `build`, `review`, `ship`, `hotfix`, `meeting`, `design`, `test`, `security`, `swarm`, `automate-me`, `reflect`, `correct`).
- **Roster-Locked Parallel Dispatch (Zero Ad-Hoc Subagents)**: Unlike generic swarms that spawn uncontrolled ad-hoc workers, `/saas-mode` and `/saas-swarm` strictly dispatch to the **14 pre-defined Senior Experts** in `roster.json` — with Antigravity native sandboxed `subagents/*.json` (DAG `enableSubagentTools: false` on non-orchestrators, read-only `security-auditor`, `workspace: "branch"` isolation).
- **Dynamic Multi-Preset Models**: Bundles all 5 OpenCode presets (`opencode`, `opencode-cc-pro`, `opencode-cc-hybrid`, `opencode-cc-deepseek`, `opencode-cc-luna`) + Claude & Antigravity presets, resolved dynamically via `SAAS_KIT_PRESET` → `~/.config/saas-kit/models.json` → session fallback without mutating plugin files.

---

## Installation

### Claude Code
```bash
/plugin marketplace add naviocean/sass-kit
/plugin install saas-kit-core@saas-kit
# Add only the domain squads your project uses:
/plugin install saas-kit-web-frontend@saas-kit
/plugin install saas-kit-nestjs-backend@saas-kit
```

### Antigravity
```bash
agy plugin install https://github.com/naviocean/sass-kit
```
`saas-kit-core` is enabled by default; the 8 domain squads ship with `"disabled": true` so you enable only the squads needed per workspace.

### Codex
```bash
codex plugin marketplace add naviocean/sass-kit
codex plugin add saas-kit-core@saas-kit
```

### OpenCode
Add `@saas-kit/core` (or local `./plugins/saas-kit-core`) to your `opencode.json` `"plugin"` array, then configure your preferred OpenCode preset:
```bash
node plugins/saas-kit-core/scripts/configure-models.mjs --list-presets
node plugins/saas-kit-core/scripts/configure-models.mjs --preset opencode-cc-pro --apply-opencode
# Or override per terminal:
SAAS_KIT_PRESET=opencode-cc-hybrid opencode
```

---

## 9 Squad Plugins Catalog

| Plugin ID | Senior Experts | Router Skills | Default |
|---|---|---|---|
| `saas-kit-core` | `tech-lead`, `pm`, `qa`, `security-auditor` | `saas-help`, `saas-mode`, `core-engineering`, `qa-security-expert` | Enabled |
| `saas-kit-web-frontend` | `frontend`, `designer` | `frontend-expert`, `designer-expert` | Disabled |
| `saas-kit-nestjs-backend` | `nestjs` | `nestjs-expert` | Disabled |
| `saas-kit-python-ai` | `ai-engineer`, `python-backend` | `ai-engineer-expert`, `python-backend-expert` | Disabled |
| `saas-kit-rust-systems` | `rustacean` | `rustacean-expert` | Disabled |
| `saas-kit-mobile-native` | `mobile` | `mobile-expert` | Disabled |
| `saas-kit-swift-macos` | `swift-macos` | `swift-macos-expert` | Disabled |
| `saas-kit-devops-infra` | `devops` | `devops-expert` | Disabled |
| `saas-kit-document-office` | `document-specialist` | `document-specialist-expert` | Disabled |

---

## Personalization & Learning Loop

- **`/automate-me`** (`saas-mode/references/automate-me.md`): Mines recent transcripts and creates `~/.config/saas-kit/personal-mode.md`, automatically loaded by `saas-mode` without touching plugin files.
- **`/correct`** & **`/reflect`**: Capture mid-session corrections and end-of-session verified lessons directly into `.agent-memory/experiences/` (`experience-library.mjs`) and ICM.

---

## Maintainer Workflow

All authoring happens once inside `.agent-core/`. Compile and verify all 9 multi-harness plugins with:

```bash
npm run build:plugins    # Compiles .agent-core/ -> plugins/saas-kit-* + root marketplace.json
npm run verify:plugins   # Runs 168 structural, DAG, manifest, and eager-budget checks
npm run build:check      # Verifies zero build drift (used in CI)
npm run test:all         # Full build + verify + unit tests + behavioral eval harness
```

For legacy v1.8.0 CLI (`npx opencode-saas-kit@1.8.0 init`), see git tag `v1.8.0`.
