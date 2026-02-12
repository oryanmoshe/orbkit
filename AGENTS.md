# AGENTS.md — OrbKit

Guide for AI coding agents working in this codebase.

## What This Project Is

**orbkit** is a composable, animated orb effects library for React. It renders multi-orb scenes with per-orb control (blur, blend mode, waviness, drift animation). Supports CSS, Canvas, and WebGL rendering backends. Includes an optional visual editor package.

## Repository Structure

```
orbkit/
├── .claude/CLAUDE.md       # Project conventions and rules
├── lefthook.yml            # Git hooks: typecheck, lint, gitmoji enforcement
├── biome.json              # Biome linter/formatter config
├── tsconfig.json           # Base TypeScript config (strict)
├── package.json            # Bun workspaces root
│
├── packages/
│   ├── core/               # npm: "orbkit" — the main library
│   │   ├── src/
│   │   │   ├── index.ts          # Public API exports
│   │   │   ├── types.ts          # All shared TypeScript interfaces
│   │   │   ├── components/       # React components (OrbScene, Orb, Grain)
│   │   │   ├── renderers/        # CSS, Canvas, WebGL rendering backends
│   │   │   ├── presets/          # Built-in theme presets (ocean, sunset, etc.)
│   │   │   └── utils/            # Color math, animation math
│   │   └── package.json
│   │
│   └── editor/             # npm: "@orbkit/editor" — optional visual editor
│       ├── src/
│       │   └── index.ts          # Stub — not yet implemented
│       └── package.json
│
└── examples/
    └── basic/              # Vite + React example app (stub)
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/types.ts` | All TypeScript interfaces — start here to understand the data model |
| `packages/core/src/components/orb.tsx` | Individual orb primitive with CSS radial-gradient rendering |
| `packages/core/src/components/orb-scene.tsx` | Container/compositor for orb scenes |
| `packages/core/src/components/grain.tsx` | Canvas-based noise overlay |
| `packages/core/src/utils/color.ts` | hexToHsl, hslToHex, applySaturation |
| `packages/core/src/utils/animation.ts` | Orbit params, drift keyframe generation |
| `packages/core/src/renderers/css-renderer.ts` | CSS rendering utilities |
| `packages/core/src/presets/index.ts` | 5 built-in presets with point data |
| `CONTEXT.md` | Full architecture doc, API design, competitive analysis |

## Tech Stack

- **TypeScript** (strict mode, no `any`)
- **Bun** — package manager, workspace management, test runner, bundler
- **React 18+** (also supports React 19)
- **Biome** — linting + formatting (replaces ESLint + Prettier)
- **Build**: `bun build` (ESM + CJS) + `tsc --emitDeclarationOnly` (types)

## Commands

```bash
bun install           # Install all workspace deps
bun run typecheck     # TypeScript check across all packages
bun run lint          # Biome check across all packages
bun run lint:fix      # Auto-fix lint/format issues
bun run build         # Build all packages
bun run test          # Run tests across all packages
```

## Conventions

- **Styling**: ZERO dependencies. Vanilla CSS class names only. No CSS-in-JS.
- **Components**: Named exports (e.g., `export function Orb`). Files are `kebab-case.tsx`.
- **Hooks**: Default exports. Files are `use-hook-name.ts`.
- **Types**: Centralized in `types.ts`. Import with `import type`.
- **Commits**: Gitmoji + Conventional Commits — format: `<emoji> <type>: <description>` (e.g., `✨ feat: add drift animation`). Enforced by lefthook commit-msg hook.
- **Testing**: Bun test runner. Test files: `*.test.tsx` or `*.test.ts`.

## Architecture Notes

- **CSS Renderer** (default): Each orb is a `<div>` with `radial-gradient` + `filter: blur()` + `mix-blend-mode`. Drift via CSS `@keyframes`. SSR compatible.
- **Canvas Renderer** (planned): Single `<canvas>`, gaussian-blurred circles.
- **WebGL Renderer** (planned): GLSL fragment shaders, simplex noise for organic effects.
- **Presets** resolve to arrays of orb points with positions, colors, and radii.
- **Drift animation** uses deterministic seeded orbits — each orb's path is computed from its position so it's reproducible.
