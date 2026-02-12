# OrbKit Roadmap

## Overview

OrbKit is a composable, animated orb effects library for React — extracted from DreamTeam.io's background customizer. This document outlines the complete roadmap from current state to v1.0 release.

## Current State (v0.0.1)

### What's Built
- Monorepo scaffold (Bun workspaces, TypeScript strict, Biome, Lefthook)
- Core types system (15 types covering all props, configs, presets)
- Components: `<OrbScene>`, `<Orb>`, `<Grain>` (basic rendering only)
- CSS renderer: radial gradients, blur, blend modes, animation keyframe generation
- Color utilities: hexToHsl, hslToHex, applySaturation (fully tested)
- Animation utilities: deterministic orbit params, drift keyframe generation (fully tested)
- 5 presets: ocean, sunset, forest, aurora, minimal
- CI pipeline (GitHub Actions: typecheck, lint, test, build)
- CodeRabbit AI code review with approval workflow

### What's Stubbed / Missing
- OrbScene context (children can't inherit scene settings)
- Drift animation not wired to `<Orb>` component
- Wavy SVG filter effect not implemented
- Interactive hover effects not implemented
- Canvas 2D renderer (empty stub)
- WebGL renderer (empty stub)
- Editor package (version constant only)
- Examples app (package.json only, no source)
- Documentation site
- npm publishing pipeline

## Phases

### Phase 1: Wire Core Features
**Goal**: Make the CSS renderer fully functional end-to-end.

| Plan | Description | Priority |
|------|-------------|----------|
| [01-scene-context](./01-scene-context.md) | OrbScene React context for child inheritance | Critical |
| [02-drift-animation](./02-drift-animation.md) | Wire drift animation into `<Orb>` component | Critical |
| [03-wavy-filter](./03-wavy-filter.md) | SVG feTurbulence filter for organic edges | High |
| [04-interactive](./04-interactive.md) | Mouse hover/follow effects | Medium |
| [05-preset-resolution](./05-preset-resolution.md) | `<OrbScene preset="ocean">` auto-renders orbs | Critical |

**Outcome**: `<OrbScene preset="ocean" />` renders a fully animated, interactive orb background with a single line of JSX.

### Phase 2: Alternative Renderers
**Goal**: Canvas 2D and WebGL backends for higher quality effects.

| Plan | Description | Priority |
|------|-------------|----------|
| [06-canvas-renderer](./06-canvas-renderer.md) | Canvas 2D with composite operations | Medium |
| [07-webgl-renderer](./07-webgl-renderer.md) | GLSL shaders with simplex noise | High |
| [08-renderer-switching](./08-renderer-switching.md) | Runtime renderer selection per scene/orb | Medium |

**Outcome**: `<OrbScene renderer="webgl" preset="aurora" />` produces Stripe-quality flowing gradients.

### Phase 3: Editor
**Goal**: Visual editor for designing orb scenes.

| Plan | Description | Priority |
|------|-------------|----------|
| [09-editor](./09-editor.md) | `@orbkit/editor` — draggable points, sliders, export | High |

**Outcome**: Drop-in `<OrbEditor />` component for live scene design with code/JSON export.

### Phase 4: Demo, Docs & Examples
**Goal**: Showcase the library and enable adoption.

| Plan | Description | Priority |
|------|-------------|----------|
| [10-examples](./10-examples.md) | examples/basic Vite app + additional examples | High |
| [11-docs-site](./11-docs-site.md) | Documentation site with interactive playground | High |
| [12-demo-showcase](./12-demo-showcase.md) | Standalone demo/showcase site | Medium |

**Outcome**: orbkit.dev with docs, live playground, and copy-paste examples.

### Phase 5: Publishing & Polish
**Goal**: npm release with provenance, changelog, and community setup.

| Plan | Description | Priority |
|------|-------------|----------|
| [13-publishing](./13-publishing.md) | npm publishing pipeline, provenance, changelog | High |
| [14-testing-strategy](./14-testing-strategy.md) | Component tests, visual regression, perf benchmarks | Medium |
| [15-hooks-api](./15-hooks-api.md) | `useOrbScene()` hook for programmatic control | Medium |

**Outcome**: `npm install orbkit` just works, with trusted publishing and full test coverage.

## Dependency Graph

```
Phase 1 (Core)
  01-scene-context ──┐
  02-drift-animation ├──→ 05-preset-resolution
  03-wavy-filter ────┘         │
  04-interactive               │
                               ▼
Phase 2 (Renderers)    Phase 3 (Editor)
  06-canvas-renderer     09-editor (needs Phase 1)
  07-webgl-renderer           │
  08-renderer-switching       │
         │                    │
         ▼                    ▼
Phase 4 (Demo & Docs)
  10-examples (needs Phase 1)
  11-docs-site (needs Phase 1 + Phase 3)
  12-demo-showcase (needs Phase 2)
         │
         ▼
Phase 5 (Publish)
  13-publishing (needs Phase 1 minimum)
  14-testing-strategy (parallel with all)
  15-hooks-api (needs 01-scene-context)
```

## Version Milestones

| Version | Contains | State |
|---------|----------|-------|
| 0.0.1 | Current scaffold | Done |
| 0.1.0 | Phase 1 complete — CSS renderer fully functional | Next |
| 0.2.0 | + Canvas renderer | — |
| 0.3.0 | + WebGL renderer | — |
| 0.4.0 | + Editor package | — |
| 0.5.0 | + Docs site + examples | — |
| 1.0.0 | Stable API, full test coverage, published to npm | — |
