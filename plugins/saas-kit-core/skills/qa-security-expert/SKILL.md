---
name: qa-security-expert
description: >-
  Router skill for SaaS Kit Core (Orchestration & Quality Gate) (tech-lead, pm, qa, security-auditor). 2-mode orchestration brain (saas-help, saas-mode), 13 lazy playbooks (incl. saas-swarm, automate-me, reflect, correct), Tech Lead, PM, QA, Security Auditor, multi-harness AgentShield hooks, and dynamic model presets.
  Loads deep domain guides lazily from references/ on demand to keep context lean.
---

# qa-security-expert

Consolidated domain router for **SaaS Kit Core (Orchestration & Quality Gate)** (experts: `tech-lead`, `pm`, `qa`, `security-auditor`).

**MANDATORY**: Before writing code or giving domain advice, read the matching reference file(s) below (and use bundled helper scripts where listed):

| Topic | Reference File | Helper Scripts | Summary |
|---|---|---|---|
| `adversarial-review` | `references/adversarial-review.md` | — | Adversarial code review targeting high-risk diffs. Actively probes for race conditions, memory leaks, state de |
| `auth-implementation-patterns` | `references/auth-implementation-patterns.md` | — | Master authentication and authorization patterns including JWT, OAuth2, session management, and RBAC to build  |
| `benchmark-checklist` | `references/benchmark-checklist.md` | — | Checklist for performance benchmarking and optimization. Enforces baseline measurement, controlled environment |
| `comment-quality` | `references/comment-quality.md` | — | Audit code comments in diffs. Eliminates redundant AI code slop while strictly preserving comments documenting |
| `create-verification-skill` | `references/create-verification-skill.md` | — | Inspect a target application's real runtime, select an interaction driver (Playwright, PTY, curl), configure l |
| `diagnose` | `references/diagnose.md` | `scripts/diagnose/` | Disciplined diagnosis loop for hard bugs and performance regressions. Reproduce → minimise → hypothesise → ins |
| `e2e-testing-patterns` | `references/e2e-testing-patterns.md` | — | Master end-to-end testing with Playwright and Cypress to build reliable test suites that catch bugs, improve c |
| `gitnexus-debugging` | `references/gitnexus-debugging.md` | — | Use when the user is debugging a bug, tracing an error, or asking why something fails. Examples: \"Why is X fa |
| `javascript-testing-patterns` | `references/javascript-testing-patterns.md` | — | Implement comprehensive testing strategies using Jest, Vitest, and Testing Library for unit tests, integration |
| `maintain-verification-skill` | `references/maintain-verification-skill.md` | — | Audit and update an existing Feature Map against code changes, re-verify touched user flows on real runtime su |
| `playwright-best-practices` | `references/playwright-best-practices.md` | — | Use when writing Playwright tests, fixing flaky tests, debugging failures, implementing Page Object Model, con |
| `runtime-forensics` | `references/runtime-forensics.md` | — | Diagnose live symptoms (CPU spikes, memory leaks, event loop lag, deadlocks) from running processes using runt |
| `secrets-management` | `references/secrets-management.md` | — | Implement secure secrets management for CI/CD pipelines using Vault, AWS Secrets Manager, or native platform s |
| `security-requirement-extraction` | `references/security-requirement-extraction.md` | — | Derive security requirements from threat models and business context. Use when translating threats into action |
| `security-scan` | `references/security-scan.md` | — | AgentShield security scanning — detect secrets, permission issues, hook vulnerabilities, MCP misconfigs |
| `systematic-debugging` | `references/systematic-debugging.md` | — | Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes |
| `tdd` | `references/tdd.md` | — | Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green |
| `test-driven-development` | `references/test-driven-development.md` | — | Use when implementing any feature or bugfix, before writing implementation code |
| `trace-forensics` | `references/trace-forensics.md` | — | Analyze captured profiling and trace artifacts (Chrome tracing JSON, cpuprofile, heap snapshot, spindump, flam |
| `verification-before-completion` | `references/verification-before-completion.md` | — | Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires runn |
| `vitest` | `references/vitest.md` | — | Vitest fast unit testing framework powered by Vite with Jest-compatible API. Use when writing tests, mocking,  |
