---
name: thermo-nuclear-code-quality
description: Strict architectural maintainability and code-judo review rubric for Tech Lead. Audits abstraction quality, file-size sprawl (>300 line warning, >1,000 line blocker), spaghetti conditional growth, type/boundary cleanliness, and canonical-layer discipline.
---

# Thermo-Nuclear Code Quality Review

Use this skill for a strict maintainability audit focused on **structural simplicity, abstraction quality, and long-term codebase health**.

Do not settle for local cosmetic cleanup. Actively search for **"code judo"** moves: restructurings that preserve behavior while making the implementation dramatically simpler, smaller, more direct, and more inevitable in hindsight.

## 1. Triggers (When to Activate)

Respect **Adaptive Socratic Sizing** — skip for trivial Size S edits unless requested. Activate during `/review` when:
- A PR is Size L/XL or touches 3+ modules.
- A diff pushes a file past **300 lines** (kit convention warning) or pushes a file from **under 1,000 lines to over 1,000 lines** (presumptive blocker).
- A diff introduces new branching/flag complexity, cross-layer helpers, or architectural refactors.
- User explicitly requests a **deep code quality audit** or **thermo-nuclear code quality review**.

---

## 2. Non-Negotiable Quality Standards

1. **Be ambitious about structural simplification ("Code Judo").**
   - Look for ways to reframe the state model or ownership boundary so whole branches, modes, flags, or helper layers disappear entirely.
   - Prefer deleting complexity over rearranging or centralizing the same messy complexity.

2. **Enforce file-size and decomposition boundaries.**
   - Kit convention warns past **300 lines** per file / **30 lines** per function (`conventions.md`).
   - **Presumptive Blocker:** Do NOT let a PR push a file from under **1,000 lines** to over **1,000 lines** without a compelling structural justification. Decompose into focused modules/helpers first.

3. **Reject random spaghetti growth in existing flows.**
   - Treat ad-hoc `if/else` statements, one-off booleans, nullable modes, or special-case branches bolted onto unrelated code paths as **design defects**, not style nits.
   - Move special-case logic behind a dedicated abstraction, typed dispatcher, state machine, or policy object.

4. **Prefer direct, boring, maintainable code over clever/magical indirection.**
   - Flag thin wrappers, identity pass-through helpers, and generic "magic" mechanisms that hide simple data shapes without buying clarity.

5. **Enforce strict type and boundary cleanliness.**
   - Zero `any`, zero `@ts-ignore` / `@ts-expect-error`, minimal casts, and no loose ad-hoc object shapes or silent fallbacks masking unclear invariants.
   - Prefer explicit typed contracts and shared DTOs/models at boundaries.

6. **Keep logic in the canonical layer and reuse canonical helpers.**
   - Call out feature-specific logic leaking into shared paths or implementation details leaking across package/domain APIs.
   - Reject bespoke one-off helpers that duplicate existing canonical utilities.

7. **Flag avoidable sequential orchestration and non-atomic updates.**
   - If obviously independent async work is serialized unnecessarily, suggest clean parallelization.
   - If related state updates can leave half-applied state on failure, push for an atomic structure.

---

## 3. Priority Order & Review Tone

Report findings in this priority order (skip cosmetic nits whenever structural issues exist):

1. Structural code-quality regressions
2. Missed opportunities for dramatic simplification / code-judo restructuring
3. Spaghetti / branching complexity increases
4. Boundary / abstraction / type-contract problems obscuring invariants
5. File-size explosion and decomposition concerns
6. Modularity, canonical-layer leaks, and helper duplication
7. Legibility and maintainability concerns

Be direct, specific, and high-conviction: cite `file:line`, explain the structural cost, and propose a concrete simpler design.

---

## 4. Report Format (Layered for Large Reviews)

- **Small / Single-Module Reviews:** Include findings directly in `_workspace/05_review_code.md` with clear priority and `file:line` citations.
- **Large / Multi-Subsystem Reviews (Size L/XL or Swarm Audits):** Use a layered directory (e.g., `_workspace/thermo-quality/` or `/tmp/<project>-thermo/`):
  - One concise summary (~200 lines max): verdict, each finding as a short narrative paragraph, proposed remediation order, and links to detail files.
  - Per-subsystem detail files (`01_<subsystem>.md`, `02_<subsystem>.md`, ...) holding measurements, commands, and worked code-judo proposals.

---

## 5. Approval Bar & Presumptive Blockers

Do NOT approve merely because tests pass. Treat these as **presumptive blockers** unless clearly justified:
- Preserves substantial incidental complexity when an obvious code-judo move would delete it.
- Pushes a file from below 1,000 lines to above 1,000 lines without decomposition.
- Bolts ad-hoc branching or feature flags onto an already busy shared flow.
- Adds unnecessary wrapper/cast/`any` churn that obscures the real contract.
- Duplicates a canonical helper or places domain logic in the wrong architectural layer.

If clean and compliant, state explicitly: **`VERDICT: PASS`**. Otherwise return **`VERDICT: CHANGES REQUESTED`** with actionable decomposition steps.
