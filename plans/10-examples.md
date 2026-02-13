# Plan 10: Examples

## Problem

The `examples/basic` directory has only a `package.json` — no source files, no Vite config, no demo content. Need working examples that showcase the library.

## Example Apps

### 1. examples/basic — Getting Started

Minimal Vite + React app demonstrating core usage:

```text
examples/basic/
  index.html
  vite.config.ts
  package.json          (already exists)
  src/
    main.tsx            — React root
    app.tsx             — Main demo
    app.css             — Minimal styles
```

**Demo content**:
- Preset-based scene (single line: `<OrbScene preset="ocean" />`)
- Composable scene (multiple `<Orb>` components with different configs)
- Standalone orb (outside a scene)
- Toggle between presets via buttons
- Dark page with centered content overlaid on the orb background

```tsx
// app.tsx
import { OrbScene, Orb, presets } from 'orbkit';

function App() {
  const [preset, setPreset] = useState<string>('ocean');

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <OrbScene preset={preset} style={{ position: 'fixed', inset: 0, zIndex: -1 }} />

      <main style={{ position: 'relative', padding: '4rem', color: 'white' }}>
        <h1>OrbKit</h1>
        <p>Composable animated orb effects for React</p>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* Use Array.from since presets may be a Map (see plan 05) */}
          {Array.from(presets.keys()).map(name => (
            <button key={name} onClick={() => setPreset(name)}>
              {name}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
```

### 2. examples/advanced — Full Features

Demonstrates all features:

```text
examples/advanced/
  index.html
  vite.config.ts
  package.json
  src/
    main.tsx
    app.tsx
    sections/
      preset-gallery.tsx      — All 5 presets side by side
      custom-scene.tsx        — Composable orbs with controls
      wavy-demo.tsx           — Wavy filter showcase
      interactive-demo.tsx    — Mouse-follow orbs
      renderer-comparison.tsx — CSS vs Canvas vs WebGL side by side
      standalone-orbs.tsx     — Orbs as standalone elements (not backgrounds)
```

### 3. examples/with-editor — Editor Integration

Demonstrates the `@orbkit/editor` package:

```text
examples/with-editor/
  index.html
  vite.config.ts
  package.json
  src/
    main.tsx
    app.tsx                  — Editor panel + live preview
```

### 4. examples/nextjs — SSR Compatibility

Next.js App Router example demonstrating SSR support:

```text
examples/nextjs/
  package.json
  next.config.ts
  app/
    layout.tsx
    page.tsx               — OrbScene in a server component layout
    client-orbs.tsx        — 'use client' component for interactive orbs
```

## Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use workspace packages directly (dev mode)
      orbkit: '../packages/core/src',
      '@orbkit/editor': '../packages/editor/src',
    },
  },
});
```

## Root Scripts

Add to root `package.json`:
```json
{
  "scripts": {
    "example:basic": "bun run --filter 'orbkit-example-basic' dev",
    "example:advanced": "bun run --filter 'orbkit-example-advanced' dev",
    "example:editor": "bun run --filter 'orbkit-example-editor' dev"
  }
}
```

## Dependencies

- Requires Phase 1 complete for basic examples
- Advanced example needs Phase 2 (renderers) + Phase 3 (editor)
- Next.js example validates SSR compatibility

## Priority

Start with `examples/basic` immediately after Phase 1 — it's the primary way to verify the library works end-to-end. Other examples can come later.
