# AGENTS.md — OrbKit

Guide for AI coding agents working in this codebase.

## What This Project Is

**orbkit** is a composable, animated orb effects library for React. It renders multi-orb scenes with per-orb control (blur, blend mode, waviness, drift animation). Supports CSS, Canvas, and WebGL rendering backends. Includes an optional visual editor package.

## Repository Structure

```
orbkit/
├── .claude/
│   ├── CLAUDE.md              # Project conventions, workflow rules
│   ├── hooks/                 # Claude Code hooks (issue workflow reminders)
│   └── settings.json          # Claude Code settings
├── lefthook.yml               # Git hooks: typecheck, lint, docs check, gitmoji + issue ref
├── biome.json                 # Biome linter/formatter config
├── tsconfig.json              # Base TypeScript config (strict)
├── package.json               # Bun workspaces root
├── plans/                     # Design docs (01-15), reference for GitHub issues
│
├── packages/
│   ├── core/                  # npm: "orbkit" — the main library
│   │   ├── src/
│   │   │   ├── index.ts             # Public API exports
│   │   │   ├── types.ts             # All shared TypeScript interfaces
│   │   │   ├── react.d.ts          # Module augmentation for CSS custom properties
│   │   │   ├── components/
│   │   │   │   ├── orb.tsx           # Orb primitive — gradient, blur, drift, wavy, interactive
│   │   │   │   ├── orb-scene.tsx     # Scene container — context provider, preset resolution
│   │   │   │   ├── grain.tsx         # Canvas-based noise overlay
│   │   │   │   ├── wavy-filter.tsx   # SVG feTurbulence + feDisplacementMap filter
│   │   │   │   ├── orb-scene.test.tsx
│   │   │   │   ├── interactive.test.tsx
│   │   │   │   └── wavy-filter.test.tsx
│   │   │   ├── context/
│   │   │   │   ├── orb-scene-context.ts   # React context, provider hook, consumer hook
│   │   │   │   ├── orb-scene-context.test.tsx
│   │   │   │   └── index.ts              # Re-exports
│   │   │   ├── renderers/
│   │   │   │   ├── renderer-interface.ts  # Re-exports OrbRenderer + OrbRenderConfig from types.ts
│   │   │   │   ├── css-renderer.ts        # CSS rendering: gradients, keyframes, animation
│   │   │   │   └── canvas-renderer.ts     # Canvas 2D rendering: rAF loop, radial gradients, SSR-guarded
│   │   │   ├── presets/
│   │   │   │   └── index.ts          # 5 built-in presets + registerPreset()
│   │   │   └── utils/
│   │   │       ├── color.ts          # hexToHsl, hslToHex, applySaturation, hexToRgba
│   │   │       ├── animation.ts      # Orbit params, drift keyframes, calculateDriftOffset
│   │   │       └── keyframe-registry.ts  # CSS @keyframes injection + dedup + SSR guard
│   │   └── package.json
│   │
│   └── editor/                # npm: "@orbkit/editor" — optional visual editor
│       ├── src/
│       │   └── index.ts             # Stub — not yet implemented
│       └── package.json
│
└── examples/
    └── basic/                 # Vite + React example app (stub)
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/types.ts` | All TypeScript interfaces — start here to understand the data model |
| `packages/core/src/components/orb.tsx` | Orb primitive: radial-gradient, blur, drift animation, wavy SVG filter |
| `packages/core/src/components/orb-scene.tsx` | Scene container: context provider, preset resolution, auto-grain injection |
| `packages/core/src/components/wavy-filter.tsx` | SVG filter for organic orb edges (feTurbulence + feDisplacementMap) |
| `packages/core/src/components/grain.tsx` | Canvas-based noise overlay |
| `packages/core/src/context/orb-scene-context.ts` | React context: scene→orb data flow, monotonic orb index counter |
| `packages/core/src/utils/keyframe-registry.ts` | CSS @keyframes injection to document head, dedup, SSR guard |
| `packages/core/src/utils/color.ts` | hexToHsl, hslToHex, applySaturation, hexToRgba |
| `packages/core/src/utils/animation.ts` | Orbit params, drift keyframes, calculateDriftOffset |
| `packages/core/src/renderers/css-renderer.ts` | CSS rendering: gradient CSS, orb animation generation |
| `packages/core/src/presets/index.ts` | 5 built-in presets (ocean, sunset, forest, aurora, minimal) + registerPreset() |

## Tech Stack

- **TypeScript** (strict mode, no `any`)
- **Bun** — package manager, workspace management, test runner, bundler
- **React 18+** (also supports React 19)
- **Biome** — linting + formatting (replaces ESLint + Prettier)
- **Lefthook** — git hooks (pre-commit: typecheck + lint + docs check, commit-msg: gitmoji + issue ref)
- **Build**: `bun build` (ESM + CJS) + `tsc --emitDeclarationOnly` (types)

## Commands

```bash
bun install           # Install all workspace deps
bun run typecheck     # TypeScript check across all packages
bun lint              # Biome check
bun lint:fix          # Auto-fix lint/format issues
bun run build         # Build all packages
bun test              # Run tests
```

## Conventions

- **Styling**: ZERO dependencies. Vanilla CSS class names only. No CSS-in-JS. Inline styles for dynamic values.
- **Components**: Named exports (e.g., `export function Orb`). Files are `kebab-case.tsx`.
- **Hooks**: Default exports. Files are `use-hook-name.ts`.
- **Types**: Centralized in `types.ts`. Import with `import type`. CSS custom properties typed via `react.d.ts` module augmentation.
- **Commits**: Gitmoji + Conventional Commits — `<emoji> <type>: <description> (#<issue>)`. Enforced by lefthook.
- **Testing**: Bun test runner. SSR-compatible tests use `renderToString`. Test files: `*.test.tsx`.
- **Docs**: Code changes MUST include doc updates (README.md, AGENTS.md, or .claude/CLAUDE.md). Enforced by pre-commit hook.

## Architecture Notes

- **OrbScene Context**: `OrbSceneContext` provides background, grain, breathing, renderer, saturation, and `registerOrb()` to child Orb components. `registerOrb()` returns a monotonic index used for animation staggering.
- **CSS Renderer** (default): Each orb is a `<div>` with `radial-gradient` + `filter: blur()` + `mix-blend-mode`. Drift via CSS `@keyframes` injected into document head. SSR compatible.
- **Drift Animation**: Deterministic seeded orbits — each orb's path is computed from its position + index. Keyframes are injected/removed via `keyframe-registry.ts` with dedup.
- **Wavy Filter**: Per-orb inline SVG with `feTurbulence` + `feDisplacementMap`. Animated via SVG `<animate>` (no JS). Uses React `useId()` for SSR-safe unique filter IDs.
- **Interactive Parallax**: Scene-level `pointermove` listener (rAF-throttled) sets CSS custom properties `--orbkit-mx`/`--orbkit-my` on container. Each interactive orb computes offset via CSS `calc()` — zero React re-renders. When both drift + interactive are active, a wrapper div separates the two transforms. Default intensity: 35%.
- **Preset Resolution**: `<OrbScene preset="ocean" />` looks up preset, auto-renders orb components with drift, auto-injects Grain overlay. Explicit props override preset defaults.
- **Canvas Renderer**: `createCanvasRenderer()` factory returns an `OrbRenderer`. Single `<canvas>` element, rAF render loop. Orbs drawn as radial gradients with `globalCompositeOperation` for blend modes. Frame-based drift via `calculateDriftOffset()`. Grain cached as `ImageData`, invalidated on resize/intensity change. Not SSR-compatible.
- **WebGL Renderer** (planned): GLSL fragment shaders, simplex noise for organic effects.

## Project Management

- **GitHub Issues**: All work tracked via issues. 5 milestones (Phase 1-5).
- **Branch naming**: `<type>/<issue#>-<description>` (e.g., `feat/5-wavy-filter`)
- **PR flow**: `closes #N` in body for auto-close. Squash-merge.
