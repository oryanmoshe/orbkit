# OrbKit — Project Instructions

## Project
**orbkit** — Composable animated orb effects for React.

## Tech Stack
- **Language**: TypeScript (strict)
- **Runtime/Package Manager**: Bun (workspaces, build, test)
- **Framework**: React 18+
- **Linting/Formatting**: Biome
- **Git Hooks**: Lefthook (pre-commit: typecheck + lint, commit-msg: gitmoji enforcement)

## Monorepo Structure
- `packages/core` → npm: `orbkit`
- `packages/editor` → npm: `@orbkit/editor`

## Build
`bun build` for ESM + CJS + `.d.ts` outputs.

## Test
`bun test`

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

## Git
- Don't commit unless explicitly asked
- **Gitmoji + Conventional Commits** — format: `<emoji> <type>: <description>`
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
- Lefthook enforces: typecheck + lint (pre-commit), gitmoji format (commit-msg)

## Documentation Sync
When making code changes, always consider whether these files need updating:
- **README.md** — Public API changes, new features, usage examples
- **AGENTS.md** — Architecture changes, new files/directories, new patterns
- **.claude/CLAUDE.md** — Convention changes, new rules, tooling updates

The pre-commit hook will warn if code changes without doc updates.

## NPM
- Don't publish unless explicitly asked
