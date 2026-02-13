#!/bin/bash
# Claude Code PreToolUse hook — enforces issue-driven development workflow.
# Fires before Bash commands, adds workflow reminders as context.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Skip if no command
[ -z "$COMMAND" ] && exit 0

emit_context() {
  local msg="$1"
  jq -n --arg ctx "$msg" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: $ctx,
      permissionDecision: "allow"
    }
  }'
  exit 0
}

# --- git commit ---
if echo "$COMMAND" | grep -qE 'git commit'; then
  emit_context "ISSUE WORKFLOW REMINDER — Commit format: <emoji> <type>: <description> (#<issue>)
Example: ✨ feat: add OrbScene context provider (#3)
The (#N) issue reference is REQUIRED. Use (#0) only for no-issue work.
Co-Authored-By line goes AFTER a blank line, not on the same line as (#N)."
fi

# --- git checkout -b / git switch -c ---
if echo "$COMMAND" | grep -qE 'git (checkout -b|switch -c)'; then
  emit_context "ISSUE WORKFLOW REMINDER — Branch format: <type>/<issue#>-<short-description>
Examples: feat/3-scene-context, fix/12-drift-offset-bug
Branch must be linked to a GitHub issue number."
fi

# --- gh pr create ---
if echo "$COMMAND" | grep -qE 'gh pr create'; then
  emit_context "ISSUE WORKFLOW REMINDER — PR body MUST include 'closes #N' to auto-close the issue on merge.
PR title format: <emoji> <type>: <description>
Include a ## Summary and ## Test plan section."
fi

# --- git push ---
if echo "$COMMAND" | grep -qE 'git push'; then
  emit_context "ISSUE WORKFLOW REMINDER — Before pushing, verify:
1. Branch name follows convention: <type>/<issue#>-<description>
2. All commits reference an issue with (#N)
3. A PR exists or will be created after pushing."
fi

# All other commands — no reminder
exit 0
