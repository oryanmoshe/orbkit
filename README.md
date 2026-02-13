# orbkit

Composable, animated orb effects for React.

[![Work in Progress](https://img.shields.io/badge/status-work%20in%20progress-yellow)](https://github.com/oryanmoshe/orbkit)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/oryanmoshe/orbkit?utm_source=oss&utm_medium=github&utm_campaign=oryanmoshe%2Forbkit&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)](https://coderabbit.ai)

## Usage

```tsx
import { OrbScene, Orb } from 'orbkit';

// Preset-based — one line
<OrbScene preset="ocean" />

// Composable — full per-orb control
<OrbScene background="#0f0f1a" grain={0.35} breathing={30}>
  <Orb color="#7C3AED" position={[0.2, 0.25]} size={0.8} blur={40} drift />
  <Orb color="#06B6D4" position={[0.75, 0.5]} size={0.75} blur={60} wavy />
  <Orb color="#3730A3" position={[0.45, 0.85]} size={0.7} blur={20} drift />
</OrbScene>
```

## Features

- **Composable** — `<OrbScene>` + `<Orb>` children, or use presets for quick setup
- **5 built-in presets** — Ocean, Sunset, Forest, Aurora, Minimal + custom presets via `registerPreset()`
- **Drift animation** — Deterministic orbital motion with configurable speed
- **Wavy edges** — Blob morph animation (CSS) / simplex noise (WebGL) for organic shapes
- **Per-orb effects** — Individual blur, blend mode, waviness, drift per orb
- **Scene context** — Orbs inherit scene settings (breathing, renderer, saturation) automatically
- **Auto grain overlay** — Noise texture injected when grain > 0
- **Canvas 2D renderer** — `createCanvasRenderer()` for single-canvas rendering with blend modes, drift, and grain
- **WebGL renderer** — `createWebGLRenderer()` with GLSL shaders, simplex noise, GPU blend modes, and anti-banding dither
- **SSR compatible** — CSS renderer works with `renderToString`, no DOM requirements at render time
- **Zero styling opinion** — Vanilla CSS class names, bring your own styling
- **TypeScript** — Strict types, full IntelliSense

## API

### `<OrbScene>`

Container and compositor for Orb components.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `preset` | `string` | — | Named preset (`ocean`, `sunset`, `forest`, `aurora`, `minimal`) |
| `background` | `string` | `#000000` | Background color |
| `grain` | `number` | `0` | Noise overlay intensity (0-1) |
| `saturation` | `number` | `70` | Color saturation (0-100) |
| `breathing` | `number` | `0` | Global animation intensity (0-100) |
| `renderer` | `'css' \| 'canvas' \| 'webgl' \| 'auto'` | `'css'` | Rendering backend |
| `as` | `string` | `'div'` | HTML element to render as |
| `className` | `string` | — | Custom CSS class |
| `style` | `CSSProperties` | — | Inline styles |

### `<Orb>`

Individual animated orb primitive.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | — | Hex color (required) |
| `position` | `[x, y]` | `[0.5, 0.5]` | Normalized position (0-1) |
| `size` | `number` | `0.75` | Orb spread radius (0-1) |
| `blur` | `number` | `40` | Blur in pixels |
| `blendMode` | `BlendMode` | `'screen'` | CSS mix-blend-mode |
| `drift` | `boolean \| DriftConfig` | — | Enable orbital drift animation |
| `wavy` | `boolean \| WavyConfig` | — | Enable organic edge distortion |
| `interactive` | `boolean` | — | Enable mouse hover parallax effect |

### Renderers

OrbKit supports three rendering backends. Use `renderer="auto"` to auto-detect the best one, or pick one explicitly.

| | CSS | Canvas 2D | WebGL |
|---|---|---|---|
| **How it works** | `<div>` per orb with `radial-gradient` + CSS `@keyframes` | Single `<canvas>`, `requestAnimationFrame` loop | Single `<canvas>`, GLSL fragment shader |
| **SSR** | Yes | No | No |
| **Max orbs** | Unlimited | Unlimited | 8 |
| **Edge distortion** | CSS `border-radius` blob morph | — | Simplex noise 3D + FBM |
| **Blend modes** | CSS `mix-blend-mode` | Canvas `globalCompositeOperation` | GLSL blend functions |
| **Anti-banding** | — | — | Jimenez gradient noise dither |
| **Grain** | Separate `<canvas>` overlay | Same canvas (offscreen composite) | Same shader pass |
| **Best for** | SSR, simple scenes, broad compat | Medium scenes, no WebGL available | High-quality visuals, many orbs |

#### Feature Compatibility Matrix

> **Warning:** This project is a work in progress. Many features are untested or visually broken across renderers. The CSS renderer is the most mature but still has issues. See individual notes below.

| Feature | CSS | Canvas 2D | WebGL | Issue |
|---------|:---:|:---------:|:-----:|-------|
| Basic orb rendering | :white_check_mark: | :white_check_mark: | :white_check_mark: | |
| Blur | :white_check_mark: | :warning: | :warning: | [#28](https://github.com/oryanmoshe/orbkit/issues/28) — Canvas/WebGL blur looks different from CSS |
| Blend modes | :warning: | :warning: | :warning: | [#29](https://github.com/oryanmoshe/orbkit/issues/29) — Not visually verified on any renderer |
| Drift animation | :warning: | :warning: | :warning: | [#30](https://github.com/oryanmoshe/orbkit/issues/30) — Barely visible, too subtle |
| Grain overlay | :white_check_mark: | :warning: | :x: | [#31](https://github.com/oryanmoshe/orbkit/issues/31) — WebGL looks terrible, Canvas untested |
| Interactive parallax | :white_check_mark: | :warning: | :warning: | [#32](https://github.com/oryanmoshe/orbkit/issues/32) — Canvas/WebGL not verified |
| Wavy/blob edges | :warning: | :x: | :warning: | [#27](https://github.com/oryanmoshe/orbkit/issues/27) — Doesn't look like bubbles |
| SSR | :warning: | :x: | :x: | [#33](https://github.com/oryanmoshe/orbkit/issues/33) — Never tested in real SSR |
| Presets | :white_check_mark: | :white_check_mark: | :white_check_mark: | |

**Legend:** :white_check_mark: Working and verified | :warning: Implemented but broken, untested, or poor quality | :x: Not implemented

#### Renderer Strengths & Weaknesses

**CSS** (default, most stable)
- Strengths: Most feature-complete, SSR-designed, no canvas overhead, supports `className`/`style` props on orbs
- Weaknesses: Multiple DOM elements (one per orb), wavy blob morph needs visual polish, drift is very subtle
- Known issues: Wavy doesn't look like real bubbles ([#27](https://github.com/oryanmoshe/orbkit/issues/27))

**Canvas 2D** (experimental)
- Strengths: Single DOM element, frame-based animation
- Weaknesses: No SSR, no wavy support, blur looks different from CSS, interactive/blend modes not visually verified, grain untested

**WebGL** (experimental)
- Strengths: GPU-accelerated, simplex noise edge distortion, anti-banding dither
- Weaknesses: No SSR, max 8 orbs, grain looks terrible, blur/blend modes/interactive not visually verified, largest code footprint

```tsx
// Auto-detect (currently returns CSS — Canvas/WebGL are experimental)
<OrbScene renderer="auto" preset="ocean" />

// Force a specific renderer
<OrbScene renderer="webgl" preset="ocean" />
```

**Auto-detection:** Currently returns CSS (the most feature-complete renderer). Canvas and WebGL are experimental and must be explicitly opted into. SSR always returns CSS. The result is cached after the first browser call.

### Presets

```tsx
import { registerPreset } from 'orbkit';

registerPreset({
  name: 'custom',
  label: 'My Custom Theme',
  backgroundColor: '#1a1a2e',
  points: [
    { id: 'p1', color: '#E94560', position: [0.3, 0.3], radius: 0.8 },
    { id: 'p2', color: '#0F3460', position: [0.7, 0.6], radius: 0.7 },
  ],
  saturation: 70,
  grain: 35,
  breathing: 25,
});

<OrbScene preset="custom" />
```

## Editor

`@orbkit/editor` provides a drop-in visual editor for designing orb scenes.

```tsx
import { OrbEditor } from '@orbkit/editor';
import '@orbkit/editor/styles.css';

// Uncontrolled — internal state
<OrbEditor />

// Controlled — external state
const [config, setConfig] = useState(DEFAULT_STATE);
<OrbEditor value={config} onChange={setConfig} />
```

**Features:**
- Live preview with draggable orb handles
- Preset gallery with randomize button
- Per-orb controls: color, size, blur, blend mode, drift/wavy/interactive toggles
- Scene controls: background, saturation, grain, breathing, renderer, symmetrical lock
- Export to JSX, JSON, or CSS with copy-to-clipboard
- Controlled and uncontrolled modes (like React form inputs)

Individual components (`CanvasPreview`, `OrbControls`, `SceneControls`, `PresetGallery`, `ExportPanel`, `OrbList`) are also exported for custom editor layouts.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| `orbkit` | [![npm](https://img.shields.io/npm/v/orbkit)](https://www.npmjs.com/package/orbkit) | Core library — components, renderers, presets |
| `@orbkit/editor` | [![npm](https://img.shields.io/npm/v/@orbkit/editor)](https://www.npmjs.com/package/@orbkit/editor) | Visual editor for designing orb scenes |

## Development

```bash
bun install        # Install dependencies
bun run typecheck  # TypeScript check
bun lint           # Biome lint + format
bun lint:fix       # Auto-fix lint/format issues
bun test           # Run tests
bun run build      # Build all packages
```

## License

MIT — [Oryan Moshe](https://github.com/oryanmoshe)
