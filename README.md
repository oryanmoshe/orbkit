# orbkit

Composable, animated orb effects for React.

[![Work in Progress](https://img.shields.io/badge/status-work%20in%20progress-yellow)](https://github.com/oryanmoshe/orbkit)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/oryanmoshe/orbkit?utm_source=oss&utm_medium=github&utm_campaign=oryanmoshe%2Forbkit&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)](https://coderabbit.ai)

## Usage

```tsx
import { OrbScene, Orb } from 'orbkit';

// Preset-based — one line
<OrbScene preset="aurora" />

// Composable — full per-orb control
<OrbScene background="#0f0f1a" grain={0.35} breathing={30}>
  <Orb color="#7C3AED" position={[0.2, 0.25]} size={0.8} blur={40} />
  <Orb color="#06B6D4" position={[0.75, 0.5]} size={0.75} blur={60} wavy />
  <Orb color="#3730A3" position={[0.45, 0.85]} size={0.7} blur={20} />
</OrbScene>

// Standalone orb
<Orb color="#FF6B35" size={200} wavy interactive />

// Programmatic control
const scene = useOrbScene({ preset: 'ocean' });
scene.addOrb({ color: '#FF0000', position: [0.5, 0.5] });
```

## Features

- **Composable** — `<OrbScene>` + `<Orb>` children, or use presets for quick setup
- **Per-orb effects** — Individual blur, blend mode, waviness, drift animation per orb
- **Multiple renderers** — CSS (default, SSR-ready), Canvas 2D, WebGL (GLSL shaders)
- **Built-in presets** — Ocean, Sunset, Forest, Aurora, Minimal
- **Zero styling opinion** — Vanilla CSS class names, bring your own styling
- **Optional visual editor** — `@orbkit/editor` for drag-and-drop scene building
- **TypeScript** — Strict types, full IntelliSense

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| `orbkit` | [![npm](https://img.shields.io/npm/v/orbkit)](https://www.npmjs.com/package/orbkit) | Core library — components, renderers, presets |
| `@orbkit/editor` | [![npm](https://img.shields.io/npm/v/@orbkit/editor)](https://www.npmjs.com/package/@orbkit/editor) | Optional visual editor |

## Development

```bash
bun install        # Install dependencies
bun run typecheck  # TypeScript check
bun run lint       # Biome lint + format
bun run test       # Run tests
bun run build      # Build all packages
```

## License

MIT — [Oryan Moshe](https://github.com/oryanmoshe)
