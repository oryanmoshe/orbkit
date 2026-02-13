# Plan 03: Wavy SVG Filter

## Problem

The `wavy` prop on `<Orb>` is accepted but not implemented. Wavy edges give orbs an organic, fluid look — the difference between a static gradient circle and a living, breathing blob.

## Approach

Use SVG `<feTurbulence>` + `<feDisplacementMap>` filters applied per-orb. This is the CSS renderer approach — no WebGL needed.

### How SVG Filters Work for Waviness

1. `feTurbulence` generates Perlin/simplex noise
2. `feDisplacementMap` distorts the source image using the noise as a displacement map
3. When applied to a radial-gradient orb, edges become organic and wobbly

```xml
<svg style="position:absolute;width:0;height:0">
  <defs>
    <filter id="orbkit-wavy-0">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.015"
        numOctaves="3"
        seed="42"
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="30"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </defs>
</svg>
```

### Animating the Waviness

CSS can't animate `feTurbulence` properties directly. Options:

1. **`<animate>` SVG element** — Animate `baseFrequency` over time using SVG's built-in animation:

   ```xml
   <feTurbulence baseFrequency="0.015" ...>
     <animate
       attributeName="baseFrequency"
       values="0.015;0.025;0.015"
       dur="8s"
       repeatCount="indefinite"
     />
   </feTurbulence>
   ```

2. **requestAnimationFrame** — Update the `seed` attribute periodically for a shifting noise pattern. More control but more JS.

3. **Multiple filters with CSS transition** — Swap between filters using CSS `filter` property transitions. Limited but zero JS.

**Recommended: Option 1 (SVG `<animate>`)** — Declarative, no JS, smooth animation. Combine with seed variation for organic uniqueness.

## Design

### WavyConfig

```typescript
interface WavyConfig {
  scale?: number;      // Displacement amount (default: 30)
  speed?: number;      // Animation speed multiplier (default: 1)
  intensity?: number;  // Number of octaves 1-6 (default: 3)
}
```

### SVG Filter Provider

A single SVG element with all wavy filters for the scene, injected by `<OrbScene>`:

```typescript
// components/wavy-filters.tsx
function WavyFilters({ orbs }: { orbs: WavyOrbConfig[] }) {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        {orbs.map((orb, i) => {
          const freq = 0.01 + (orb.scale ?? 30) * 0.0005;
          return (
          <filter id={`orbkit-wavy-${orb.id}`} key={orb.id}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={freq}
              numOctaves={orb.intensity ?? 3}
              seed={i * 17}
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values={`${freq};${freq * 1.5};${freq}`}
                dur={`${8 / (orb.speed ?? 1)}s`}
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={orb.scale ?? 30}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          );
        })}
      </defs>
    </svg>
  );
}
```

### Orb Integration

When `wavy` is truthy, the orb applies the SVG filter:

```tsx
const filterStyle = wavy ? {
  filter: `url(#orbkit-wavy-${orbId}) blur(${blur}px)`,
} : {
  filter: `blur(${blur}px)`,
};
```

### Registration Flow

There are two possible approaches for managing SVG filters:

1. **Centralized (scene-level):** `<Orb wavy>` registers itself with the scene context (orb ID + wavy config). `<OrbScene>` collects all wavy registrations and renders a single `<WavyFilters>` SVG. Each wavy `<Orb>` references its filter by ID. This reduces DOM nodes but adds registration complexity.

2. **Inline (per-orb):** Each `<Orb>` with `wavy` renders its own inline SVG filter as a sibling. More DOM nodes but simpler implementation with no context dependency.

**Recommended for v1: Inline per-orb.** Each orb manages its own SVG `<filter>` element. This avoids registration plumbing, keeps the wavy feature independent of scene context, and is simpler to implement/debug. The centralized approach can be adopted later as an optimization if scenes with many wavy orbs cause performance issues (see Performance Notes below).

## Files to Create

| File | Purpose |
|------|---------|
| `packages/core/src/components/wavy-filter.tsx` | SVG filter component for a single orb |

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/components/orb.tsx` | Render `<WavyFilter>` when wavy is truthy, apply filter reference |
| `packages/core/src/types.ts` | Verify WavyConfig shape |

## Dependencies

- Independent of scene context (filter is per-orb)
- Works with CSS renderer only. Canvas/WebGL renderers handle waviness differently (shader noise).

## Testing

- Orb with `wavy={true}` renders an SVG filter element
- Orb with `wavy={false}` has no SVG filter
- WavyConfig scale affects displacement amount
- WavyConfig speed affects animation duration
- Filter IDs are unique per orb (no collisions)
- Filter is removed on unmount

## Performance Notes

- SVG filters are GPU-accelerated in modern browsers
- Each filter is a separate compositing pass — 3-5 wavy orbs is fine, 20+ may cause jank
- `feTurbulence` with numOctaves > 4 gets expensive — cap at 6
- The `<animate>` element is handled natively by the browser's SVG engine, not by JS
