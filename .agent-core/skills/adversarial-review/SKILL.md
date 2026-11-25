---
name: adversarial-review
description: Adversarial and thermo-nuclear diff audit targeting high-risk changes, bugs, breaking changes, DevEx regressions, feature-gate leaks, and security vulnerabilities. Enforces empirical runtime verification before any PASS verdict.
---

# Adversarial & Thermo-Nuclear Review

Adversarial review is an aggressive, read-only quality-hardening and security audit designed to break code before it reaches production. Unlike routine formatting/style reviews, the reviewer operates with a hostile, high-rigor mindset — tracing cross-module side effects, security boundaries, DevEx regressions, and feature-gate leaks so nothing slips through.

## 1. Triggers (When to Activate)

Follow **Adaptive Socratic Sizing** — do NOT run full adversarial review on trivial Size S tweaks unless explicitly requested. Activate when ANY of the following holds:
- `gitnexus_impact` indicates **HIGH** or **CRITICAL** blast radius.
- Diff touches security-critical boundaries (authentication, authorization, token rotation, cryptography, multi-tenant isolation).
- Diff touches financial transactions, payments, or billing flows.
- Diff introduces multi-actor concurrency (Tokio tasks, worker queues, WebSocket synchronizers, database locks).
- Diff touches cross-module shared state, core database migrations, feature flags, or local dev/build configuration.
- User explicitly requests a **deep review**, **thermo-nuclear review**, or **PR/branch audit**.

---

## 2. Scope & Investigation Discipline

- **Diff-Scoped Only:** ONLY report issues introduced or exposed by code ADDED or MODIFIED in the current branch/PR diff. Do NOT file unrelated legacy findings in untouched code.
- **No Unfinished Research:** NEVER report speculative caveats like *"The client has issue X, unless the backend handles it"* when the backend code is readable in the repository. Trace end-to-end and verify before reporting.
- **Intended Breakage Calibration:** If a high-risk change is clearly the stated, well-constrained intent of the branch (e.g., intentionally removing a deprecated feature flag), do not waste the author's time flagging it — UNLESS the blast radius exceeds their stated scope, they appear unaware of downstream impact, or the change looks unsafe/malicious.
- **Zero Over-Reporting:** Never inflate minor nits to High/MUST-FIX. Calibrate severity honestly so developers trust every blocker.

---

## 3. Probing Vectors

The reviewer runs as an independent, **read-only** audit pass (`security-auditor` or read-only review slice). It assumes the code is broken until proven resilient.

1. **Race Conditions & Concurrency:**
   - What happens if two requests arrive with the exact same ID within 5ms?
   - Is there a check-then-act race (TOCTOU)?
   - Can an in-flight operation be interrupted by a process restart or network timeout?
2. **State Desynchronization & Leaks:**
   - Does a failed intermediate step leave orphaned records in the database?
   - Are in-memory caches invalidated when a write fails halfway?
   - Does any connection, file descriptor, or listener fail to close in error paths?
3. **Cross-Module Breaking Functionality:**
   - Trace callers and consumers across packages (`gitnexus_impact` / `gitnexus_context`) for subtle side effects that break existing behavior.
4. **Breaking DevEx Regressions:**
   - Catch changes that silently break how developers build or run the project locally:
     - Changing how or where secrets are read.
     - Renaming or adding required environment variables without defaults/docs.
     - Remapping ports or local networking assumptions.
     - Adding mandatory new scripts/manual setup steps required for existing workflows to keep working. *(Normal package manager deps or optional alternative commands are not DevEx breaks.)*
5. **Feature-Gate & Internal-Only Leaks:**
   - Verify features intended to stay behind feature flags, tenant gates, or internal-only checks cannot leak through new routes, shared utilities, UI entrypoints, or API responses.
6. **Boundary & Injection Exploits:**
   - Can unexpected unicode, oversized payloads, negative numbers, or missing tenant filters bypass validation?
   - Are raw database IDs, secrets, or internal stack traces exposed across public APIs?
7. **Symptom Masking & Swallowed Errors:**
   - Did the author use a blanket `try/catch`, defensive `if (!x) return`, or null-coalescing (`?? null`) to conceal an unhandled state?
   - Does the error path log/propagate properly, or silently corrupt state?

---

## 4. Empirical Verification Invariant (NON-NEGOTIABLE)

> [!IMPORTANT]
> You **CANNOT** issue `VERDICT: PASS` based on abstract code inspection alone.
> Every `PASS` verdict MUST cite concrete empirical runtime verification evidence (passing reproduction/unit/integration test output, terminal driver output, or fresh real-surface evidence in `docs/verification/evidence/`).
> If changes lack empirical proof, reject with **`VERDICT: REJECT (missing empirical verification)`**.

---

## 5. Findings Classification

Every finding MUST cite `file:line`, concrete proof, and an exact reproduction sequence:

| Severity | Definition | Action Required |
|---|---|---|
| **MUST-FIX (High/Critical)** | Reproducible crash, race condition, data corruption, security flaw, breaking DevEx, or feature-gate leak. | Merging is **BLOCKED**. Author must fix with a regression test. |
| **CONSIDER (Medium)** | Latent fragility, missing timeout, or scalability bottleneck under high load. | Tech Lead reviews; fix or defer with a tracked issue. |
| **REJECT (Low/Nit)** | Stylistic preference, hypothetical refactor, or out-of-scope nit. | Discarded by Tech Lead with technical rationale. |

---

## 6. Post-Audit PR Discussion Cross-Check

- Perform your entire audit **with fresh eyes first** — do NOT read PR/MR review comments beforehand.
- **After** completing your audit, if you have Medium-to-High findings and a PR/MR exists for the branch, inspect PR discussion via `gh`/`glab` CLI to check review-bot or peer comments.
- Evaluate any additional issues they caught, incorporate valid ones into your report, and explicitly tag findings originating from PR discussion/bots.

---

## 7. Transparency & Honesty Rule (Non-Negotiable)

> [!IMPORTANT]
> If the current environment or AI harness does not support independent read-only subagent dispatch:
> - **DO NOT** claim that the independent adversarial review gate passed.
> - Report explicitly: `LIMITATION: Independent adversarial review unavailable in current harness`.
> - Tech Lead notes this as an unverified risk in the review summary.
