# /saas-swarm — Roster-Locked Parallel Execution Playbook

Use when the user explicitly requests parallel multi-expert execution (e.g., concurrent refactor + test + security audit, or parallel multi-domain feature delivery) while strictly enforcing the 14 Senior Expert Roster.

## Hard Rules

1. **Zero Ad-Hoc Workers**: Every spawned worker MUST be a named Senior Expert from `roster.json`. Never spawn generic workers (`worker-1`, `helper`, `general-coder`).
2. **Missing Squad = Halt**: Before spawning, verify every needed expert's squad plugin (`saas-kit-*`) is installed/enabled. If any required squad is missing, STOP and print the exact install command for that squad.
3. **DAG Only**: Only `tech-lead` / root coordinator spawns delegates. All spawned experts run with `enableSubagentTools: false`.
4. **Disjoint Ownership**: Each parallel expert MUST own disjoint file paths matching `roster.json` `ownedPaths` to guarantee zero merge conflicts.

## Execution Protocol

### Step 1: Decompose & Map to Roster
1. Break the request into independent work slices.
2. Map each slice to a specific Senior Expert ID (`frontend`, `nestjs`, `rustacean`, `mobile`, `swift-macos`, `ai-engineer`, `python-backend`, `devops`, `document-specialist`, `qa`, `security-auditor`).
3. Verify zero overlapping file paths between concurrent writers.

### Step 2: Dispatch in Parallel (Harness-Native)
- **Antigravity**: Invoke each expert using its compiled `subagents/<expert>.json` (`invoke_subagent` in parallel with `Workspace: "branch"` for writers, `"inherit"` for read-only `security-auditor`; or assign exact Senior Expert persona/model/workspace if inside a native `/swarm` session).
- **Claude Code**: Invoke parallel `Agent`/`Task` calls targeting `agents/<expert>.md` (inherits built-in `model` frontmatter + git worktree isolation).
- **OpenCode**: Dispatch parallel subagents targeting `agents/<expert>.md` using the active preset model (`SAAS_KIT_PRESET` / `~/.config/saas-kit/models.json`).

### Step 3: Convergence & Quality Gate (Sequential)
1. Wait for all parallel experts to return structured evidence (diff summary + test output).
2. `tech-lead` merges/reviews changes and runs `gitnexus_detect_changes({repo: "<current-repo>"})` (if indexed).
3. `qa` runs full test suite & runtime verification across integrated changes.
4. `security-auditor` (read-only) runs AgentShield security gate (`security-gate.mjs`).
5. Report final verdict with clickable file links and test evidence.
