# OrbKit — Full Context Dump

## Project Identity

- **Name**: orbkit
- **npm**: `orbkit` (available), `@orbkit/editor` for optional editor
- **Repo**: `github.com/oryanmoshe/orbkit`
- **Author**: Oryan Moshe (@oryanmoshe)
- **What**: Composable, animated orb effects for React. Multi-orb scenes with per-orb control (blur, blend, waviness, drift). Optional visual editor. Multiple rendering backends (CSS, Canvas, WebGL).

## Origin

Extracted from DreamTeam.io's background customizer feature (branch: `background-customizer-9000` in `dreamteam-io-client`).

---

## Source Code Reference (DreamTeam.io)

All source files live in `/Users/oryan/dev/dreamteam-io-workspace/dreamteam-io-client/src/`.

### Core Rendering
- `components/gradient-background/gradient-background-component.js` — Main renderer. Maps `backgroundTheme.points` to `<OrbLayer>` divs with deterministic elliptical drift animation + grain noise `<canvas>` overlay. Key constants: `MAX_DURATION=40`, `MIN_DURATION=6`, `MIN_AMPLITUDE=2`, `MAX_AMPLITUDE=10`.
- `components/gradient-background/gradient-background-component-styles.js` — styled-components. `GradientBackground` (absolute fill, z-index:-1), `OrbLayer` (130% size for edge overflow, mix-blend-mode:screen, CSS keyframe drift), `GrainCanvas` (mix-blend-mode:overlay).
- `components/gradient-background/use-gradient-background-connector.js` — Redux connector. Reads `currentUser.settings.backgroundTheme`, merges with `previewTheme` from context.
- `components/gradient-background/gradient-theme-context.js` — React context: `GradientThemeProvider` with `previewTheme`, `setLivePreview`, `clearLivePreview`.

### Utilities (`utils/gradient-utils.js`)
```javascript
hexToHsl(hex)              // #RRGGBB → {h, s, l}
hslToHex(h, s, l)          // HSL → #RRGGBB
applySaturation(hex, sat)  // Adjust saturation 0-100
generateGradientCSS(theme) // Full theme → CSS background string
generateSingleOrbCSS(point, saturation) // Single point → radial-gradient CSS
generateGrainIntensity(grain) // 0-100 → 0-0.5 opacity
```

### Presets (`constants/gradient-theme-presets.js`)
5 built-in presets, each with: `name`, `label`, `backgroundColor`, `points[]`, `saturation`, `grain`, `breathing`.

| Preset | Background | Colors | Saturation |
|--------|-----------|--------|-----------|
| Ocean | #1a1a1a | Blue, coral, cream | 70 |
| Sunset | #1a1018 | Orange, pink, purple | 75 |
| Forest | #0f1a14 | Dark green, green, cream | 60 |
| Aurora | #0f0f1a | Purple, cyan, indigo | 80 |
| Minimal | #1a1918 | Cream, gray, beige | 30 |

Point data shape:
```javascript
{ id: "p1", color: "#4A90D9", position: { x: 0.2, y: 0.25 }, radius: 0.8 }
```

Theme data shape:
```javascript
{
  version: 1,
  preset: "ocean",
  backgroundColor: "#1a1a1a",
  points: [...],
  saturation: 70,   // 0-100
  grain: 35,         // 0-100
  breathing: 30,     // 0-100
}
```

### Editor — Main Component (`components/gradient-theme-editor/gradient-theme-editor-component.js`)
- Renders inside app's `DrawerComponent` (width: 380px)
- Sections: preset selector, randomize/save buttons, canvas with draggable points, color point editor, vibrancy slider, background color swatches (12 dark colors), grain slider, breathing slider
- `randomizeTheme()` — generates 4-5 random points with random colors/positions
- `randomHex()` — HSL-based random color (s: 40-100, l: 30-70)
- Background colors: `["#0a0a0a", "#1a1a1a", "#2E2D2C", "#3D1C1C", "#1a1018", "#2D1B4E", "#0f0f1a", "#0C2340", "#0f1a14", "#1a2e1a", "#1a1918", "#3B2F20"]`

### Editor — Canvas (`gradient-canvas/`)
- `gradient-canvas-component.js` — Renders theme preview + draggable `PointHandle` circles
- `use-gradient-canvas-state.js` — Mouse drag logic: `handlePointMouseDown`, `handleCanvasMouseDown` (click to add), `isDragging` state

### Editor — Color Point Editor (`color-point-editor/`)
- Color picker + radius slider for the currently selected point
- Delete point button

### Editor — Preset Selector (`theme-preset-selector/`)
- Shows built-in presets + user-saved custom presets
- Delete custom preset support

### Editor — Floating Button (`theme-editor-floating-button/`)
- FAB that opens the editor drawer

---

## Current Rendering Technique (Detail)

### Orb Rendering
Each orb = an absolutely positioned `<div>` at 130% parent size (for overflow), with:
```css
background: radial-gradient(at X% Y%, adjustedColor 0%, transparent radius%);
mix-blend-mode: screen;
```

### Drift Animation
Elliptical orbit via 8-step CSS keyframe:
```
0%     → translate(ax%, 0)
12.5%  → translate(ax*0.707%, ay*0.707%)
25%    → translate(0, ay%)
37.5%  → translate(-ax*0.707%, ay*0.707%)
50%    → translate(-ax%, 0)
62.5%  → translate(-ax*0.707%, -ay*0.707%)
75%    → translate(0, -ay%)
87.5%  → translate(ax*0.707%, -ay*0.707%)
100%   → translate(ax%, 0)
```

Orbit params seeded from point position (`seed = x*1000 + y*7919`), giving each point a unique but deterministic orbit shape.

Duration: `baseDuration * (1 + index * 0.3)` — each successive orb is 30% slower, creating visual depth.
Delay: `index * -baseDuration * 0.25` — staggered start for organic feel.

### Grain Overlay
Full-size `<canvas>` with random grayscale noise, rendered once + on resize. `mix-blend-mode: overlay`, opacity from grain setting (0-100 → 0-0.5).

---

## App-Specific Couplings to Remove

1. **Redux** — `useGradientBackgroundConnector` reads `currentUser.settings.backgroundTheme`
2. **Redux** — `useGradientThemeEditorConnector` dispatches save actions with debounce
3. **styled-components** — All styles
4. **App UI** — `DrawerComponent`, `SliderComponent` from internal component library
5. **i18n** — `translate()` from internal translate service
6. **lodash** — `map()` (trivial)

---

## Target Architecture

### Tech Stack
- **Language**: TypeScript (strict)
- **Runtime/Package Manager**: Bun
- **Build**: `bun build` (ESM + CJS outputs)
- **Monorepo**: Bun workspaces
- **Testing**: `bun test`
- **Styling**: Zero opinion — vanilla CSS class names, consumers bring their own styling
- **WebGL** (optional renderer): OGL or raw WebGL
- **CI**: GitHub Actions

### Package Structure
```
orbkit/
├── .claude/
│   └── CLAUDE.md
├── .gitignore
├── package.json              # Bun workspaces root
├── tsconfig.json             # Base TS config
├── README.md
├── LICENSE                   # MIT
│
├── packages/
│   ├── core/                 # npm: orbkit
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts      # Public API exports
│   │       ├── components/
│   │       │   ├── orb-scene.tsx    # <OrbScene> — container/compositor
│   │       │   ├── orb.tsx          # <Orb> — individual orb primitive
│   │       │   ├── grain.tsx        # <Grain> — noise overlay
│   │       │   └── index.ts
│   │       ├── renderers/
│   │       │   ├── css-renderer.ts      # Default renderer
│   │       │   ├── canvas-renderer.ts   # Canvas 2D
│   │       │   └── webgl-renderer.ts    # GLSL shaders
│   │       ├── presets/
│   │       │   └── index.ts
│   │       └── utils/
│   │           ├── color.ts
│   │           └── animation.ts
│   │
│   └── editor/               # npm: @orbkit/editor (optional)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── orb-editor.tsx
│           ├── canvas-preview.tsx
│           └── color-picker.tsx
│
├── examples/
│   └── basic/
│
└── docs/
```

### Target API

```tsx
// 1. Simple — preset-based
<OrbScene preset="aurora" />

// 2. Composable — full per-orb control
<OrbScene background="#0f0f1a" grain={0.35} breathing={30}>
  <Orb color="#7C3AED" position={[0.2, 0.25]} size={0.8} blur={40} />
  <Orb color="#06B6D4" position={[0.75, 0.5]} size={0.75} blur={60} wavy />
  <Orb color="#3730A3" position={[0.45, 0.85]} size={0.7} blur={20} />
</OrbScene>

// 3. Standalone orb (not just backgrounds)
<Orb color="#FF6B35" size={200} wavy interactive />

// 4. With optional editor
import { OrbEditor } from '@orbkit/editor';
<OrbEditor scene={sceneRef} />

// 5. Programmatic control
const scene = useOrbScene({ preset: 'ocean' });
scene.addOrb({ color: '#FF0000', position: [0.5, 0.5] });
scene.removeOrb('orb-id');
scene.setBreathing(50);
```

### Per-Orb Props
| Prop | Type | Description |
|------|------|-------------|
| `color` | `string` | Hex color |
| `position` | `[number, number]` | Normalized [x, y] 0-1 |
| `size` | `number` | Orb spread radius (0-1 normalized or px) |
| `blur` | `number` | Per-orb fuzziness (px) — CSS `filter: blur()` |
| `blendMode` | `string` | `'screen'` \| `'overlay'` \| `'soft-light'` \| etc. |
| `wavy` | `boolean \| WavyConfig` | Organic edge animation. `{ scale, speed, intensity }` |
| `drift` | `boolean \| DriftConfig` | Orbit animation. `{ speed, amplitude, direction }` or false |
| `renderer` | `'css' \| 'canvas' \| 'webgl'` | Per-orb renderer override |
| `interactive` | `boolean` | Mouse hover effects |
| `className` | `string` | Custom CSS class |

### Scene Props
| Prop | Type | Description |
|------|------|-------------|
| `background` | `string` | Background color |
| `grain` | `number` | Noise overlay 0-1 |
| `breathing` | `number` | Global animation intensity 0-100 |
| `preset` | `string` | Named preset |
| `renderer` | `string` | Default renderer for all children |
| `className` | `string` | Custom CSS class |
| `style` | `CSSProperties` | Inline styles |
| `as` | `'div' \| 'section' \| etc.` | Render as different element |

---

## Rendering Approaches (Detail)

### CSS Renderer (Default)
- Each orb: `<div>` with `radial-gradient` + `filter: blur(Xpx)` + `mix-blend-mode`
- Drift: CSS `@keyframes` with elliptical path
- Waviness: SVG `<feTurbulence>` + `<feDisplacementMap>` filter applied per-orb
- Grain: `<canvas>` with random noise, `mix-blend-mode: overlay`
- Pros: SSR compatible, zero deps, best performance, works everywhere
- Cons: Limited organic effects compared to WebGL

### Canvas Renderer
- Single `<canvas>`, each orb drawn as gaussian-blurred circle
- Blending via canvas composite operations (`globalCompositeOperation`)
- Grain on same canvas
- Pros: Better blending control, single DOM element
- Cons: No SSR, slightly more CPU

### WebGL Renderer
- GLSL fragment shaders per orb (or single multi-orb shader)
- Simplex noise (`snoise3`) for organic waviness
- GPU-accelerated, most beautiful effects
- Mouse interactivity via shader uniforms
- Pros: Highest quality, GPU performance, organic effects
- Cons: WebGL dependency, no SSR, OGL or similar needed

---

## ReactBits Orb Reference Implementation

ReactBits Orb uses **OGL** (minimal WebGL renderer) + custom **GLSL fragment shader**.

### Full Shader Technique
```glsl
// Simplex noise for waviness
float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
// Noise modulates orb edge radius over time
float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);

// Two lighting functions for depth
float light1(float intensity, float attenuation, float dist) {
  return intensity / (1.0 + dist * attenuation);
}
float light2(float intensity, float attenuation, float dist) {
  return intensity / (1.0 + dist * dist * attenuation);
}

// Hover distortion via sin waves
uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);
```

### Color System
- 3 base colors blended dynamically
- YIQ color space for hue rotation (`rgb2yiq` → rotate → `yiq2rgb`)
- `adjustHue(color, hueDeg)` rotates hue in YIQ space

### Props
```tsx
<Orb
  hue={0}                    // Hue rotation in degrees
  hoverIntensity={0.2}       // Distortion strength on hover
  rotateOnHover={true}       // Rotation animation on hover
  forceHoverState={false}    // Always show hover effect
  backgroundColor="#000000"  // Background blend color
/>
```

Single orb only, no composition, no editor, no presets.

---

## Competitive Landscape

| Package | Stars | What | Missing vs OrbKit |
|---------|-------|------|-------------------|
| react-ai-orb | Low | Single animated AI orb | No multi-orb, no editor, no presets |
| react-gradient-animation | ~200 | Animated gradient background | No orb positioning, no per-orb control, no editor |
| React Bits Orb | Part of collection | WebGL single orb with waviness | No composition, no editor, no presets |
| @mesh-gradient/core | Low | WebGL mesh gradients (SwiftUI-style) | Different technique entirely, no orbs |
| easy-mesh-gradient | Low | CSS mesh gradient utility | Utility only, no React component |
| animated-gradient | Low | Linear gradient color transitions | Linear only, no orbs |
| @blur-ui/mesh-gradient | Low | Apple-style mesh gradient | Single mesh, no orb concept |

**OrbKit's unique value: composable multi-orb + per-orb effects (blur, blend, wavy) + visual editor + multiple rendering backends + presets**

---

## Effort Estimate

| Task | Days | Notes |
|------|------|-------|
| Project scaffold (Bun, TS, workspace) | 0.5 | |
| Extract core renderer from DreamTeam | 1 | Port gradient-utils, presets, animation math |
| Per-orb blur + blend modes | 1 | CSS `filter` + `mix-blend-mode` props |
| SVG filter waviness (CSS renderer) | 1-2 | `feTurbulence` + `feDisplacementMap` |
| WebGL renderer with GLSL shaders | 3-5 | Simplex noise, multi-orb support |
| TypeScript types + build config | 0.5 | |
| Editor extraction + headless | 2-3 | Remove styled-components, make generic |
| Docs site + examples | 2-3 | |
| **Total** | **~2 weeks** | |

---

## Key Design Decisions

1. **Bun over pnpm/tsup** — Single tool for package management, workspaces, bundling, testing. Simpler toolchain.
2. **CSS-first renderer** — SSR compatible, zero deps, works everywhere. WebGL as progressive enhancement.
3. **Composable over config** — `<OrbScene><Orb /><Orb /></OrbScene>` over `<OrbScene config={{points: [...]}} />`. Both should work.
4. **Zero styling opinion** — Vanilla CSS class names. No styled-components, no Tailwind dependency. Consumers style however they want.
5. **Per-orb fuzziness** — Each orb gets its own `filter: blur()` instead of shared radial-gradient transparency.
6. **Per-orb blend mode** — Not just `screen` for all. Expose `overlay`, `soft-light`, `multiply`, etc.
7. **Waviness via SVG filters (CSS mode)** — `feTurbulence` for organic edges without WebGL dependency.
8. **Optional editor** — Separate package, not bundled with core. Import only if needed.
