# OrbKit — Project Instructions

## Project
**orbkit** — Composable animated orb effects for React.

## Tech Stack
- **Language**: TypeScript (strict)
- **Runtime/Package Manager**: Bun (workspaces, build, test)
- **Framework**: React 18+
- **Linting/Formatting**: Biome
- **Git Hooks**: Lefthook (pre-commit: typecheck + lint, commit-msg: gitmoji + issue ref enforcement)
- **Project Management**: GitHub Issues + Milestones

## Monorepo Structure
- `packages/core` → npm: `orbkit`
- `packages/editor` → npm: `@orbkit/editor`

## Commands
- **Build**: `bun build`
- **Test**: `bun test`
- **Typecheck**: `bun run typecheck`
- **Lint**: `bun lint` (check) / `bun lint:fix` (auto-fix)
- **Always use `bun lint:fix`** before committing to fix formatting + import sorting. Never use `bunx @biomejs/biome` directly — use the project scripts.

## Styling Rule
**ZERO styling dependencies.** Vanilla CSS class names only. No styled-components, no Tailwind, no CSS-in-JS. Consumers bring their own.

## Code Conventions
- Strict TypeScript — no `any`
- Named exports for components
- Default exports for hooks
- All components are `.tsx`, all utils are `.ts`

## File Structure Per Component
- `component-name.tsx` — Component
- `component-name.css` — Styles
- `component-name.test.tsx` — Tests
- `types.ts` — Shared types

## Issue-Driven Development

**All work is tracked via GitHub Issues.** This is the core workflow:

### Before Starting Work
1. Check open issues: `gh issue list --milestone "Phase X" --state open`
2. Pick an issue (or create one if the work isn't tracked yet)
3. Create a feature branch from `main` named after the issue

### Branch Naming
Format: `<type>/<issue#>-<short-description>`
- `feat/3-scene-context`
- `fix/12-drift-offset-bug`
- `docs/7-update-readme`

### Commit Messages
Format: `<emoji> <type>: <description> (#<issue>)`
- `✨ feat: add OrbScene context provider (#3)`
- `🐛 fix: correct drift offset shape (#12)`
- `✅ test: add scene context tests (#3)`

The `(#N)` suffix is **required** on every commit. Lefthook enforces this.
Exception: commits on `main` directly (e.g., config changes) can use `(#0)` for no-issue work.

### PR Flow
1. Push branch, create PR with `gh pr create`
2. PR title: `<emoji> <type>: <description>`
3. PR body must include `closes #N` to auto-close the issue on merge
4. Wait for CodeRabbit review
5. Squash-merge to keep history clean

### Creating Issues
When work needs doing but no issue exists:
```bash
gh issue create --title "feat: short description" --milestone "Phase 1: Wire Core Features" --label "feature,priority: high" --body "Description here"
```

### Issue Labels
- **Priority**: `priority: critical`, `priority: high`, `priority: medium`
- **Phase**: `phase-1` through `phase-5`
- **Type**: `feature`, `bug`, `refactor`, `docs`, `dependencies`

### Milestones

| Milestone | Version | Description |
|-----------|---------|-------------|
| Phase 1: Wire Core Features | v0.1.0 | CSS renderer fully functional |
| Phase 2: Alternative Renderers | v0.2.0-v0.3.0 | Canvas + WebGL |
| Phase 3: Editor | v0.4.0 | Visual editor package |
| Phase 4: Demo, Docs & Examples | v0.5.0 | Docs site + examples |
| Phase 5: Publishing & Polish | v1.0.0 | npm publish + tests |

### Plans Directory
Design docs live in `plans/`. Each plan (01-15) maps to one or more GitHub issues.
Plans are reference material — issues are the source of truth for what's in progress.

## Git
- Don't commit unless explicitly asked
- **Gitmoji + Conventional Commits** — format: `<emoji> <type>: <description> (#<issue>)`
  - `✨ feat:` new feature
  - `🐛 fix:` bug fix
  - `🚑️ fix:` critical hotfix
  - `♻️ refactor:` code restructuring
  - `🎨 style:` improve structure/format
  - `📝 docs:` documentation
  - `🔧 chore:` configuration files
  - `🔨 chore:` dev scripts
  - `✅ test:` tests
  - `⚡️ perf:` performance
  - `🔥 chore:` remove code/files
  - `➕ chore:` / `➖ chore:` / `⬆️ chore:` dependencies
  - `👷 ci:` CI build system
  - `🏗️ refactor:` architectural changes
  - `🏷️ feat:` types
  - `🎉 feat:` initial commit
  - Full emoji list: https://gitmoji.dev
- Commit frequently — small, focused commits over large batches
- Lefthook enforces: typecheck + lint (pre-commit), gitmoji format + issue ref (commit-msg)

## Documentation Sync
When making code changes, always consider whether these files need updating:
- **README.md** — Public API changes, new features, usage examples
- **AGENTS.md** — Architecture changes, new files/directories, new patterns
- **.claude/CLAUDE.md** — Convention changes, new rules, tooling updates

The pre-commit hook will warn if code changes without doc updates.

## NPM
- Don't publish unless explicitly asked
