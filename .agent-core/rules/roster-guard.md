# Roster Guard — Zero Ad-Hoc Subagents (MANDATORY)

Every multi-agent delegation in `saas-kit` MUST obey this rule without exception.

## 1. Strict Senior Expert Roster

- **NEVER invent, improvise, or spawn ad-hoc custom subagents** (e.g., `general-coder`, `worker-1`, `rust-helper`, `api-fixer`).
- Every delegated subagent MUST match one of the **14 pre-defined Senior Experts** in `roster.json`:
  - **Core (`saas-kit-core`)**: `tech-lead`, `pm`, `qa`, `security-auditor`
  - **Web Frontend (`saas-kit-web-frontend`)**: `frontend`, `designer`
  - **NestJS Backend (`saas-kit-nestjs-backend`)**: `nestjs`
  - **Python & AI (`saas-kit-python-ai`)**: `ai-engineer`, `python-backend`
  - **Rust Systems (`saas-kit-rust-systems`)**: `rustacean`
  - **Mobile Native (`saas-kit-mobile-native`)**: `mobile`
  - **Swift macOS (`saas-kit-swift-macos`)**: `swift-macos`
  - **DevOps & SRE (`saas-kit-devops-infra`)**: `devops`
  - **Document & Office (`saas-kit-document-office`)**: `document-specialist`

## 2. Missing Squad Protocol (Halt, Do Not Improvise)

If a task requires a Senior Expert whose squad plugin is NOT installed or NOT enabled in the current workspace:

1. **STOP** before dispatching that domain slice.
2. Report which Senior Expert is needed and print the exact 1-line install/enable command for the user's harness:
   - **Claude Code**: `/plugin install <pluginId>@saas-kit`
   - **Antigravity**: `agy plugin install https://github.com/naviocean/sass-kit --plugin <pluginId>` (or enable `<pluginId>` in workspace `config.json`)
   - **OpenCode**: add `"<pluginId>"` to `opencode.json` `"plugin"` array
3. Wait for the user to install/enable the squad plugin (or explicitly authorize a fallback).

## 3. Roster-Locked Parallel Dispatch & DAG Rule

- **DAG Enforcement**: Only `tech-lead` (or the root coordinator running `/saas-mode` / `/saas-swarm`) may spawn subagents. All 13 other Senior Experts run with `enableSubagentTools: false` and MUST NOT spawn nested workers.
- **Domain Ownership Lock**: Parallel workers MUST touch only their declared `ownedPaths` in `roster.json` and run in isolated branches/worktrees (`workspace: "branch"`).
- **Convergence Gate**: After parallel workers finish, `tech-lead` MUST run `gitnexus_detect_changes` (when indexed), dispatch `qa` for verification, and dispatch read-only `security-auditor` before declaring completion.
