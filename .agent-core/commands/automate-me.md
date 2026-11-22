# /automate-me — Personal Mode Generator

Distills your recurring working style, coding preferences, review expectations, and autonomy boundaries into a persistent personal overlay at `~/.config/saas-kit/personal-mode.md` — never mutating installed plugin files.

## When to Use
- User says "automate me", "create my personal mode", "learn my coding style", or "update my personal preferences".

## Execution Protocol

### Step 1: Mine Recent History (Read-Only, Privacy-Safe)
1. Inspect recent local session transcripts (if available in the harness artifact/transcript directory) and `.agent-memory/experiences/` + `icm recall "preferences"`.
2. Extract recurring signals ONLY:
   - Language & communication tone (e.g., concise Vietnamese/English, direct feedback, bullet vs prose).
   - Autonomy boundaries (when to ask vs when to execute directly).
   - Engineering taste (testing style, naming, error handling, commit style, favorite frameworks).
   - Recurring corrections the user has given agents.
3. **NEVER include secrets, tokens, API keys, credentials, or private customer data.**

### Step 2: Quick Clarification (Max 3 Targeted Questions, One at a Time)
Confirm any ambiguous preferences (e.g., default autonomy level, preferred test runner, PR/commit style).

### Step 3: Write External Personal Mode File
Write/update `~/.config/saas-kit/personal-mode.md` with concise, actionable rules (≤ 3 KB so it stays light in context):
- Communication & Language
- Autonomy & Decision Gates
- Coding & Architecture Preferences
- Review & Verification Bar

### Step 4: Verify & Store Summary
- Confirm `saas-mode` will automatically read `~/.config/saas-kit/personal-mode.md` at session start.
- Store key preference highlights in ICM (`icm store -t preferences ...`).
