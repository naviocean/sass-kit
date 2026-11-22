# /correct — Mid-Session Course Correction & Structural Capture

Immediate mid-session correction workflow: fix the current mistake right away AND encode the rule so the same mistake never repeats.

## When to Use
- User corrects agent behavior, points out a violated convention, or invokes `/correct`.

## Execution Protocol

1. **Acknowledge & Fix Immediately**: Stop the wrong path and apply the exact fix to the current task first. Verify the fix passes tests/checks.
2. **Diagnose Why It Happened**: Identify the missing cue, wrong assumption, or unstated preference that caused the error.
3. **Encode the Lesson Permanently**:
   - If project/domain technical lesson → record `(cue, lesson, evidence)` via `scripts/experience-library.mjs` into `.agent-memory/experiences/<domain>/`.
   - If personal working preference → append/update `~/.config/saas-kit/personal-mode.md` and store via `icm store -t preferences -i critical`.
   - If recurring bug class → add a regression test before closing the turn.
4. **Confirm**: Briefly state (a) what was fixed and (b) where the lesson was persisted.
