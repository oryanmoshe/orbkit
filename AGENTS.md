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
│   │   │   │   ├── orb.tsx           # Orb primitive — gradient/blur/drift (CSS) or register+null (imperative)
│   │   │   │   ├── orb-scene.tsx     # Scene container — resolves renderer, routes CSS vs imperative
│   │   │   │   ├── imperative-scene.tsx  # Canvas/WebGL bridge — mounts renderer, syncs props, ResizeObserver
│   │   │   │   ├── grain.tsx         # Canvas-based noise overlay (CSS renderer only)
│   │   │   │   ├── wavy-filter.tsx   # SVG feTurbulence + feDisplacementMap filter (legacy, unused by blob morph)
│   │   │   │   ├── orb-scene.test.tsx
│   │   │   │   ├── renderer-switching.test.tsx
│   │   │   │   ├── interactive.test.tsx
│   │   │   │   └── wavy-filter.test.tsx
│   │   │   ├── context/
│   │   │   │   ├── orb-scene-context.ts   # React context, provider hook, consumer hook
│   │   │   │   ├── orb-scene-context.test.tsx
│   │   │   │   └── index.ts              # Re-exports
│   │   │   ├── renderers/
│   │   │   │   ├── renderer-interface.ts  # Re-exports OrbRenderer + OrbRenderConfig from types.ts
│   │   │   │   ├── detect.ts             # Auto-detection: WebGL > Canvas > CSS (cached, SSR-safe)
│   │   │   │   ├── css-renderer.ts        # CSS rendering: gradients, keyframes, animation
│   │   │   │   ├── canvas-renderer.ts     # Canvas 2D rendering: rAF loop, radial gradients, SSR-guarded
│   │   │   │   ├── webgl-renderer.ts      # WebGL rendering: context, uniforms, animation loop
│   │   │   │   └── shaders/
│   │   │   │       ├── index.ts           # Thin re-export: imports .glsl files, prepends WebGL1/2 preambles
│   │   │   │       ├── glsl.d.ts          # TypeScript module declaration for .glsl imports
│   │   │   │       ├── orb.vert.glsl      # Vertex shader (WebGL2, single source of truth)
│   │   │   │       └── orb.frag.glsl      # Fragment shader body (single source of truth)
│   │   │   ├── presets/
│   │   │   │   └── index.ts          # 5 built-in presets + registerPreset()
│   │   │   └── utils/
│   │   │       ├── color.ts          # hexToHsl, hslToHex, applySaturation, hexToRgba
│   │   │       ├── animation.ts      # Orbit params, drift keyframes, calculateDriftOffset
│   │   │       ├── blob.ts           # Blob morph keyframes: seeded random border-radius for wavy effect
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
| `packages/core/src/components/orb.tsx` | Orb primitive: radial-gradient, blur, drift animation, blob morph (wavy), interactive parallax |
| `packages/core/src/components/orb-scene.tsx` | Scene container: context provider, preset resolution, auto-grain injection |
| `packages/core/src/components/wavy-filter.tsx` | SVG filter for organic orb edges (legacy, replaced by blob morph) |
| `packages/core/src/utils/blob.ts` | Blob morph keyframe generator — seeded random border-radius for wavy effect |
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

- **OrbScene Context**: `OrbSceneContext` provides background, grain, breathing, renderer, saturation, `registerOrb()`, `registerOrbConfig()`/`unregisterOrbConfig()`, and `imperativeRendererRef` to child components. `registerOrb()` returns a monotonic index for animation staggering.
- **Renderer Switching**: `<OrbScene renderer="auto|css|canvas|webgl">` resolves the renderer type. For CSS: orbs render `<div>` elements. For Canvas/WebGL: `<ImperativeScene>` mounts the renderer, and `<Orb>` components register their configs via context then render null. No mixed renderers in v1 — the scene renderer applies to all orbs.
- **Auto-Detection**: `detectBestRenderer()` returns `'css'` — the most feature-complete renderer. Canvas/WebGL are opt-in only. Result is cached after first browser call. SSR always returns CSS (not cached). When `renderer="auto"`, OrbScene defers detection to `useEffect` to avoid SSR/CSR hydration mismatches — initial render always uses CSS. WebGL wavy noise is conditional per-orb via `u_orbWavy` uniform array.
- **ImperativeScene**: Internal component that bridges React props to imperative renderers. Creates renderer, mounts it, syncs background/grain/resize via effects. Orb configs flow through context refs — `registerOrbConfig()` directly calls `renderer.setOrbs()` without triggering React re-renders.
- **CSS Renderer** (default): Each orb is a `<div>` with `radial-gradient` + `filter: blur()` + `mix-blend-mode`. Drift via CSS `@keyframes` injected into document head. Grain overlay via separate `<canvas>`. SSR compatible.
- **Drift Animation**: Deterministic seeded orbits — each orb's path is computed from its position + index. Keyframes are injected/removed via `keyframe-registry.ts` with dedup.
- **Wavy/Blob Morph (CSS)**: When `wavy` is enabled, the CSS renderer switches from full-bleed `radial-gradient` to a positioned blob div with animated `border-radius` morphing. Keyframes generated by `blob.ts` using a seeded PRNG for deterministic, per-orb unique shapes. The blob morph animation (`orbkit-blob-{seed}`) is injected/removed via the keyframe registry. Standalone orbs (no scene) use a stable fallback index derived from `useId()` hash. **Known issue**: visual quality doesn't convincingly resemble bubbles yet (see #27).
- **Wavy Filter (legacy)**: `wavy-filter.tsx` contains the original SVG `feTurbulence` + `feDisplacementMap` approach. Currently unused — replaced by blob morph. Kept for potential future use.
- **Interactive Parallax**: Scene-level `pointermove` listener (rAF-throttled) sets CSS custom properties `--orbkit-mx`/`--orbkit-my` on container. Each interactive orb computes offset via CSS `calc()` — zero React re-renders. For imperative renderers, `setPointerPosition(x, y)` pipes pointer data directly. When both drift + interactive are active, a wrapper div separates the two transforms. Default intensity: 35%. Canvas/WebGL interactive not yet visually verified (#32).
- **Preset Resolution**: `<OrbScene preset="ocean" />` looks up preset, auto-renders orb components with drift, auto-injects Grain overlay (CSS only — imperative renderers handle grain internally). Explicit props override preset defaults.
- **Canvas Renderer**: `createCanvasRenderer()` factory returns an `OrbRenderer`. Single `<canvas>` element, rAF render loop. Orbs drawn as radial gradients with `globalCompositeOperation` for blend modes. Per-orb Gaussian blur via `ctx.filter = 'blur(Npx)'` (DPR-scaled) for soft edges and orb merging that approximates CSS blur. Frame-based drift via `calculateDriftOffset()`. Grain cached on offscreen canvas, composited via `drawImage`. `unmount()` stops the rAF loop before detaching. Not SSR-compatible.
- **WebGL Renderer**: `createWebGLRenderer()` factory returns an `OrbRenderer`. Single fullscreen triangle with GLSL fragment shader. Simplex noise 3D (Ashima) + FBM for organic edge distortion (conditional per-orb via `u_orbWavy` uniform). Blur controls smoothstep falloff distance (factor 0.035). All 8 blend modes in GLSL. Anti-banding dither (Jimenez). Max 8 orbs (uniform arrays, warns on overflow). WebGL2 with WebGL1 fallback. Falls back to Canvas renderer if WebGL unavailable. `unmount()` stops the rAF loop before detaching. Not SSR-compatible.

## Feature Compatibility

> **Many features are untested or visually broken.** Only features marked "Verified" have been manually confirmed to work well.

| Feature | CSS | Canvas 2D | WebGL | Issues |
|---------|:---:|:---------:|:-----:|--------|
| Basic rendering | Verified | Verified | Verified | |
| Blur | Verified | Broken | Broken | #28 |
| Blend modes | Untested | Untested | Untested | #29 |
| Drift | Broken | Broken | Broken | #30 |
| Grain | Verified | Untested | Broken | #31 |
| Interactive | Verified | Untested | Untested | #32 |
| Wavy/blob | Broken | None | Untested | #27 |
| SSR | Untested | N/A | N/A | #33 |

## Project Management

- **GitHub Issues**: All work tracked via issues. 5 milestones (Phase 1-5).
- **Branch naming**: `<type>/<issue#>-<description>` (e.g., `feat/5-wavy-filter`)
- **PR flow**: `closes #N` in body for auto-close. Squash-merge.
