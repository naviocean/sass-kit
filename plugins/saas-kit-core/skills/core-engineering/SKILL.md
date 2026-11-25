---
name: core-engineering
description: >-
  Router skill for SaaS Kit Core (Orchestration & Quality Gate) (tech-lead, pm, qa, security-auditor). 2-mode orchestration brain (saas-help, saas-mode), 13 lazy playbooks (incl. saas-swarm, automate-me, reflect, correct), Tech Lead, PM, QA, Security Auditor, multi-harness AgentShield hooks, and dynamic model presets.
  Loads deep domain guides lazily from references/ on demand to keep context lean.
---

# core-engineering

Consolidated domain router for **SaaS Kit Core (Orchestration & Quality Gate)** (experts: `tech-lead`, `pm`, `qa`, `security-auditor`).

**MANDATORY**: Before writing code or giving domain advice, read the matching reference file(s) below (and use bundled helper scripts where listed):

| Topic | Reference File | Helper Scripts | Summary |
|---|---|---|---|
| `api-design-principles` | `references/api-design-principles.md` | — | Master REST and GraphQL API design principles to build intuitive, scalable, and maintainable APIs that delight |
| `architecture-decision-records` | `references/architecture-decision-records.md` | — | Write and maintain Architecture Decision Records (ADRs) following best practices for technical decision docume |
| `architecture-patterns` | `references/architecture-patterns.md` | — | Implement proven backend architecture patterns including Clean Architecture, Hexagonal Architecture, and Domai |
| `brainstorming` | `references/brainstorming.md` | `scripts/brainstorming/` | You MUST use this before any creative work - creating features, building components, adding functionality, mod |
| `brief-to-tasks` | `references/brief-to-tasks.md` | — | Break a design brief into an ordered checklist of independently buildable tasks using vertical slices. Saves a |
| `changelog-automation` | `references/changelog-automation.md` | — | Automate changelog generation from commits, PRs, and releases following Keep a Changelog format. Use when sett |
| `code-review-excellence` | `references/code-review-excellence.md` | — | Master effective code review practices to provide constructive feedback, catch bugs early, and foster knowledg |
| `coding-standards` | `references/coding-standards.md` | — | TypeScript coding standards — strict mode, naming conventions, imports, error handling for all agents |
| `continuous-learning` | `references/continuous-learning.md` | — | Auto-extract patterns from sessions with confidence scoring — instincts evolve into reusable skills over time |
| `database-migration` | `references/database-migration.md` | — | Execute database migrations across ORMs and platforms with zero-downtime strategies, data transformation, and  |
| `design-tokens` | `references/design-tokens.md` | — | Generate a design tokens file (CSS variables or Tailwind config) based on a chosen aesthetic philosophy, with  |
| `dispatching-parallel-agents` | `references/dispatching-parallel-agents.md` | — | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies |
| `enhance-prompt` | `references/enhance-prompt.md` | — | Transforms vague UI ideas into polished, Stitch-optimized prompts. Enhances specificity, adds UI/UX keywords,  |
| `executing-plans` | `references/executing-plans.md` | `scripts/executing-plans/` | Use when executing an implementation plan in the current session as the implementer yourself — your human part |
| `find-skills` | `references/find-skills.md` | — | Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for  |
| `finishing-a-development-branch` | `references/finishing-a-development-branch.md` | — | Use when implementation is complete, all tests pass, and you need to decide how to integrate the work |
| `git-advanced-workflows` | `references/git-advanced-workflows.md` | — | Master advanced Git workflows including rebasing, cherry-picking, bisect, worktrees, and reflog to maintain cl |
| `git-workflow` | `references/git-workflow.md` | — | Git conventions — branch naming, conventional commits, merge strategy, PR format for all agents |
| `gitnexus-cli` | `references/gitnexus-cli.md` | — | Use when the user needs to run GitNexus CLI commands like analyze/index a repo, check status, clean the index, |
| `gitnexus-exploring` | `references/gitnexus-exploring.md` | — | Use when the user asks how code works, wants to understand architecture, trace execution flows, or explore unf |
| `gitnexus-guide` | `references/gitnexus-guide.md` | — | Use when the user asks about GitNexus itself — available tools, how to query the knowledge graph, MCP resource |
| `gitnexus-pr-review` | `references/gitnexus-pr-review.md` | — | Use when the user wants to review a pull request, understand what a PR changes, assess risk of merging, or che |
| `gitnexus-refactoring` | `references/gitnexus-refactoring.md` | — | Use when the user wants to rename, extract, split, move, or restructure code safely. Examples: \"Rename this f |
| `handoff` | `references/handoff.md` | — | Compact the current conversation into a handoff document for another agent to pick up. |
| `link-workspace-packages` | `references/link-workspace-packages.md` | — | Link workspace packages in monorepos (npm, yarn, pnpm, bun). USE WHEN: (1) you just created or generated new p |
| `monitor-ci` | `references/monitor-ci.md` | `scripts/monitor-ci/` | Monitor Nx Cloud CI pipeline and handle self-healing fixes. USE WHEN user says "monitor ci", "watch ci", "ci m |
| `monorepo-management` | `references/monorepo-management.md` | — | Master monorepo management with Turborepo, Nx, and pnpm workspaces to build efficient, scalable multi-package  |
| `nx-generate` | `references/nx-generate.md` | — | Generate code using nx generators. INVOKE IMMEDIATELY when user mentions scaffolding, setup, structure, creati |
| `nx-workspace-patterns` | `references/nx-workspace-patterns.md` | — | Configure and optimize Nx monorepo workspaces. Use when setting up Nx, configuring project boundaries, optimiz |
| `orchestrate` | `references/orchestrate.md` | — | Tech Lead work breakdown and coordination. Analyzes tasks, dispatches subagents with Task, plans execution ord |
| `react-state-management` | `references/react-state-management.md` | — | Master modern React state management with Redux Toolkit, Zustand, Jotai, and React Query. Use when setting up  |
| `review-agent-setup` | `references/review-agent-setup.md` | — | Configure human-in-the-loop gating for AI agent review actions in Claude Code. Use when setting up a project w |
| `scan` | `references/scan.md` | — | Scans the codebase to generate project-doc.md and AGENTS.md. Runs a full scan on first use and a smart delta s |
| `socratic-planning` | `references/socratic-planning.md` | — | Socratic method for ALL requests. Asks clarifying questions before coding. Scales from 1 question (small fixes |
| `subagent-driven-development` | `references/subagent-driven-development.md` | `scripts/subagent-driven-development/` | Use when executing implementation plans with independent tasks in the current session |
| `thermo-nuclear-code-quality` | `references/thermo-nuclear-code-quality.md` | — | Strict architectural maintainability and code-judo review rubric for Tech Lead. Audits abstraction quality, fi |
| `to-issues` | `references/to-issues.md` | — | Break a plan, spec, or PRD into independently-grabbable issues on the project issue tracker using tracer-bulle |
| `to-prd` | `references/to-prd.md` | — | Turn the current conversation context into a PRD and publish it to the project issue tracker. Use when user wa |
| `triage` | `references/triage.md` | — | Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and |
| `typescript-advanced-types` | `references/typescript-advanced-types.md` | — | Master TypeScript's advanced type system including generics, conditional types, mapped types, template literal |
| `using-git-worktrees` | `references/using-git-worktrees.md` | — | Use when starting feature work that needs isolation from current workspace or before executing implementation  |
| `ux-flow` | `references/ux-flow.md` | — | User experience flow mapping — entry points, navigation, actions, feedback, outcomes with Mermaid diagrams |
| `writing-plans` | `references/writing-plans.md` | — | Use when you have a spec or requirements for a multi-step task, before touching code |
| `writing-skills` | `references/writing-skills.md` | — | Use when creating new skills, editing existing skills, or verifying skills work before deployment |
