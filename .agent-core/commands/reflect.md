# /reflect — End-of-Session Lesson Distillation

Distills verified root causes, architectural insights, and debugging lessons from the current session into the project's **Experience Library** (`scripts/experience-library.mjs`) and **ICM**.

## When to Use
- End of a complex feature/bugfix session, after resolving a subtle failure, or when user invokes `/reflect`.

## Execution Protocol

1. **Gather Evidence**: Review what failed, what fixed it, and the exact verification command/output that proved the fix worked (PStack Evidence Honesty — never store unverified guesses).
2. **Classify Domain**: Identify the owning domain (`frontend`, `nestjs`, `rust`, `mobile`, `swift-macos`, `python-ai`, `devops`, `qa`, `security`, or `general`).
3. **Record Structured Experience**:
   - Store `(cue, lesson, evidence)` via `experience-library.mjs` into `.agent-memory/experiences/<domain>/` (which automatically rejects secrets and requires concrete evidence).
   - Store high-value cross-session lessons via `icm store -t errors-resolved` or `icm store -t decisions-<project>`.
4. **Structural Check**: Ask whether this lesson should also become a permanent lint rule, unit test, or checklist item so future sessions catch it mechanically.
5. **Summarize**: Print the saved experience path(s) and ICM memory ID(s) concisely.
