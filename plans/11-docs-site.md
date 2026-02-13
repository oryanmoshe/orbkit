# Plan 11: Documentation Site

## Problem

OrbKit needs a documentation site with interactive examples — not just API reference, but a showcase that lets visitors see and play with orb effects live.

## Framework Choice

### Evaluation

| Framework | React Native | Interactive Playground | Performance | Maintainability |
|-----------|-------------|----------------------|-------------|-----------------|
| **Fumadocs** | Yes (Next.js) | Built-in CLI | Excellent | Active, modern |
| Starlight | Via Astro Islands | Custom needed | Excellent | Very active |
| Docusaurus | Yes | Plugin-based | Good | Mature, large community |
| Storybook | Yes | Built-in | OK | Mature but heavy |
| Ladle | Yes | Built-in | Excellent | Lighter Storybook alt |
| Histoire | Via plugins | Built-in | Good | Vue-first |

### Recommendation: Fumadocs

Fumadocs is the best fit for OrbKit because:
- Built on Next.js — native React component rendering
- Built-in CLI for generating interactive component playgrounds
- TypeScript Twoslash for inline type information in code blocks
- Beautiful default theme with dark mode
- Content collections with type safety
- Built-in search (no Algolia needed)
- Active development, modern patterns

### Alternative: Custom with Next.js

Given OrbKit is a visual library, a custom docs site might showcase it better than any template. A hybrid approach:
- Use Fumadocs for the standard docs pages (getting started, API reference, guides)
- Custom pages for the interactive playground and showcase

## Site Structure

```
docs.orbkit.dev (or orbkit.dev/docs)
├── /                        — Landing page with live orb background
├── /docs
│   ├── /getting-started     — Installation, quick start, first scene
│   ├── /components
│   │   ├── /orb-scene       — OrbScene API + examples
│   │   ├── /orb             — Orb API + examples
│   │   └── /grain           — Grain API + examples
│   ├── /features
│   │   ├── /presets          — Built-in presets gallery
│   │   ├── /drift            — Drift animation guide
│   │   ├── /wavy             — Wavy filter guide
│   │   ├── /interactive      — Interactive effects guide
│   │   └── /renderers        — CSS vs Canvas vs WebGL
│   ├── /guides
│   │   ├── /custom-presets   — Creating your own presets
│   │   ├── /ssr              — Server-side rendering
│   │   ├── /performance      — Performance optimization tips
│   │   └── /migration        — Migrating from other gradient libs
│   └── /api                  — Full TypeScript API reference
├── /playground               — Interactive editor (embeds @orbkit/editor)
├── /showcase                 — Gallery of orb scenes (community submissions)
└── /examples                 — Live demos with source code
```

## Interactive Playground

The killer feature: embed `@orbkit/editor` directly in the docs site so visitors can:
1. Tweak orb parameters live (colors, positions, blur, blend mode)
2. See the result in real-time
3. Copy the generated JSX/JSON/CSS
4. Share configurations via URL params

```tsx
// pages/playground.tsx
import { OrbEditor } from '@orbkit/editor';
import { OrbScene } from 'orbkit';

export default function Playground() {
  const [config, setConfig] = useState(defaultConfig);

  return (
    <div className="playground-layout">
      <div className="playground-preview">
        <OrbScene {...configToProps(config)} />
      </div>
      <div className="playground-controls">
        <OrbEditor value={config} onChange={setConfig} />
      </div>
      <div className="playground-code">
        <CodeBlock language="tsx">{configToJSX(config)}</CodeBlock>
      </div>
    </div>
  );
}
```

### URL-Shareable Configs

Encode the config in the URL hash for shareability. Uses URL-safe base64 encoding and
wraps decoding in try/catch to handle corrupted or tampered URLs gracefully:

```typescript
// --- Helpers: URL-safe base64 (handles non-ASCII via encodeURIComponent) ---

function toBase64Url(str: string): string {
  // Percent-encode to handle non-ASCII, then base64-encode, then make URL-safe
  const base64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  ));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): string {
  // Restore standard base64 chars and padding, then decode
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return decodeURIComponent(
    Array.from(atob(padded), (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
  );
}

// --- Encode ---
const hash = toBase64Url(JSON.stringify(config));
window.location.hash = hash;

// --- Decode (safe — falls back to default config on bad input) ---
function loadConfigFromHash(defaultConfig: OrbConfig): OrbConfig {
  const raw = window.location.hash.slice(1);
  if (!raw) return defaultConfig;

  try {
    return JSON.parse(fromBase64Url(raw));
  } catch {
    console.warn('Failed to decode config from URL hash, using defaults');
    return defaultConfig;
  }
}
```

## Component Examples in Docs

Each component page should have:
1. **Live preview** — rendered component above the fold
2. **Code block** — copy-paste JSX
3. **Props table** — TypeScript-powered, auto-generated
4. **Variants** — different configurations shown as interactive tabs

Use Fumadocs' built-in component rendering or Sandpack for editable examples.

## Landing Page

The landing page IS the product demo:
- Full-viewport orb background (preset: aurora or custom)
- Hero text: "Composable animated orb effects for React"
- "Try it" button scrolls to an inline editor
- Scroll sections showing different presets and configurations
- Each section has a different orb background that transitions as you scroll

## Modern Alternative to Storybook

Instead of Storybook (heavy, complex config), consider:

### Ladle
- Lightweight Storybook alternative built on Vite
- React-only, fast HMR
- Stories format compatible with Storybook
- Much simpler config

### Custom Component Gallery
Since OrbKit is visual, a custom gallery page in the docs might work better:

```
/docs/gallery
  - Grid of preset thumbnails (live-rendered, not images)
  - Click to expand into full-screen with controls
  - Each card shows the OrbScene + metadata
```

This is more compelling than Storybook's dev-focused UI.

## Project Structure

```
docs/
  package.json
  next.config.ts (or fumadocs config)
  content/
    docs/
      getting-started.mdx
      components/
        orb-scene.mdx
        orb.mdx
        grain.mdx
      features/
        presets.mdx
        drift.mdx
        wavy.mdx
        interactive.mdx
        renderers.mdx
      guides/
        custom-presets.mdx
        ssr.mdx
        performance.mdx
  app/
    layout.tsx
    page.tsx              — Landing page
    playground/
      page.tsx            — Interactive playground
    showcase/
      page.tsx            — Gallery
  components/
    live-example.tsx      — Renders OrbKit components inline in MDX
    code-block.tsx        — Syntax highlighted + copy button
    props-table.tsx       — Auto-generated from TypeScript types
```

## Domain

Options:
- `orbkit.dev` — clean, professional
- `orbkit.io` — alternative
- GitHub Pages at `oryanmoshe.github.io/orbkit` — free, no custom domain

## Dependencies

- Requires Phase 1 minimum for basic docs
- Playground requires Phase 3 (editor package)
- Renderer comparison page requires Phase 2
- Can start with basic docs early (getting started, component API, presets)

## Hosting

- Vercel (free for OSS) — ideal for Next.js/Fumadocs
- GitHub Pages — if using static export
- Netlify — alternative
