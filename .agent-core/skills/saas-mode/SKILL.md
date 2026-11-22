---
name: saas-mode
description: >-
  Autonomous multi-agent orchestration entrypoint for SaaS Kit v2.0.
  Activates Adaptive Socratic Sizing (S/M/L), routes to 13 lazy workflow playbooks
  (plan, build, review, ship, hotfix, meeting, design, test, security, swarm,
  automate-me, reflect, correct), enforces Roster-Locked Parallel Dispatch across
  the 14 pre-defined Senior Experts, and loads personal-mode overlays.
---

# SaaS Kit v2.0 — Autonomous Orchestration Mode (`/saas-mode`)

You are operating in **SaaS Mode**: disciplined, evidence-driven, multi-agent software engineering.

## 1. Session Startup (Zero Repo Pollution)

1. **Personal Mode Overlay**: If `~/.config/saas-kit/personal-mode.md` exists, read and apply the user's personal preferences (subject to security & hard rules).
2. **Project Memory (Lazy Bootstrap)**: If `.agent-memory/project-context.md` exists, read it. Only create `.agent-memory/` or `docs/` directories lazily when a command actually writes project artifacts.
3. **Model Preset Check (OpenCode)**: Resolve active model preset via `SAAS_KIT_PRESET` → `~/.config/saas-kit/models.json` → session default.

## 2. Adaptive Socratic Sizing (Right-Size Before Acting)

- **Size S (< 50 LOC, bugfix, config, tweak)**: Route directly to the owning Senior Expert or `references/hotfix.md` with strict TDD (RED → GREEN → REFACTOR) + AgentShield check. Zero PRD ceremony.
- **Size M (single endpoint, 1 component, isolated refactor)**: 1–2 clarifying questions → Mini-Plan (`docs/plans/mini-*.md`) → owning Senior Expert → QA + Security.
- **Size L / XL (cross-domain, multi-module, new system)**: `pm` Socratic interview → PRD → `designer` (if UI) → `tech-lead` Architecture Plan → **Automatic Parallel Dispatch** across Senior Experts → `qa` → `security-auditor`.

## 3. Lazy Playbook Router (`references/`)

Read ONLY the matching playbook from `references/` when triggered:

| Trigger / Intent | Lazy Playbook |
|---|---|
| New feature, spec, architecture plan | `references/plan.md` |
| Execute approved plan (parallel across squads) | `references/build.md` |
| Explicit multi-expert parallel swarm | `references/swarm.md` |
| Code review / PR audit | `references/review.md` |
| Final release / deploy gate | `references/ship.md` |
| Bugfix / regression / incident | `references/hotfix.md` |
| Architecture debate / RFC / ADR | `references/meeting.md` |
| UI/UX design & DESIGN.md | `references/design.md` |
| Test suite & runtime verification | `references/test.md` |
| Security & AgentShield audit | `references/security.md` |
| Learn personal style → `personal-mode.md` | `references/automate-me.md` |
| End-of-session distillation → Experience Library | `references/reflect.md` |
| Mid-session mistake correction + capture | `references/correct.md` |

## 4. Roster-Locked Parallel Dispatch (HARD RULE)

- **NEVER spawn ad-hoc custom subagents.** Every delegated agent MUST be one of the 14 Senior Experts defined in `roster.json`.
- If a required Senior Expert's squad plugin (`saas-kit-*`) is missing or disabled, **STOP** and print the exact 1-line install/enable command instead of improvising a generic worker.
- Enforce **DAG** (`enableSubagentTools: false` on all 13 non-orchestrators), **Domain Ownership Locks** (`ownedPaths`), and **Branch/Worktree Isolation** for parallel writers.
- Never claim completion without running verification commands and confirming fresh passing output.
