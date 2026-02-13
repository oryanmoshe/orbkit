# Plan 06: Canvas 2D Renderer

## Problem

The Canvas renderer is an empty stub. Canvas 2D offers better blending control than CSS and uses a single DOM element instead of N divs per orb.

## When to Use Canvas Over CSS

| Scenario | CSS | Canvas |
|----------|-----|--------|
| 1-5 orbs, simple drift | Best | Overkill |
| 5-15 orbs, complex blending | OK | Better |
| Dynamic orb count (add/remove) | DOM churn | Clean |
| Custom blend curves | Limited to CSS modes | Full control |
| SSR required | Works | No SSR |

## Architecture

### Renderer Interface

All renderers should conform to a common interface:

```typescript
interface OrbRenderer {
  readonly type: RendererType;
  mount(container: HTMLElement): void;
  unmount(): void;
  setOrbs(orbs: OrbRenderConfig[]): void;
  setBackground(color: string): void;
  setGrain(intensity: number): void;
  resize(width: number, height: number): void;
  start(): void;
  stop(): void;
  destroy(): void;
}

interface OrbRenderConfig {
  id: string;
  color: string;
  position: Point;
  size: number;
  blur: number;
  blendMode: BlendMode;
  drift: boolean | DriftConfig;
  wavy: boolean | WavyConfig;
}
```

### Internal Orb Representation

The renderer pre-computes derived values when orbs are set, avoiding per-frame recalculation:

```typescript
// Internal representation with pre-computed values
interface InternalOrb extends OrbRenderConfig {
  adjustedColor: string;            // Parsed color with full opacity
  adjustedColorTransparent: string; // Same color with 0 opacity (for gradient stops)
  orbitParams: DriftOrbitParams;    // Pre-computed orbit amplitude/duration/delay
}

function toInternalOrbs(configs: OrbRenderConfig[]): InternalOrb[] {
  return configs.map(config => ({
    ...config,
    adjustedColor: parseColor(config.color),
    adjustedColorTransparent: parseColor(config.color, 0),
    orbitParams: computeOrbitParams(config),
  }));
}
```

### Canvas Implementation

```typescript
export function createCanvasRenderer(options: CanvasRendererOptions): OrbRenderer {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  let animationId: number | null = null;
  let orbs: InternalOrb[] = [];

  function render(time: number) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Orbs with blending
    for (const orb of orbs) {
      ctx.globalCompositeOperation = mapBlendMode(orb.blendMode);
      ctx.save();

      // Apply drift offset
      const offset = calculateDriftOffset(orb, time);
      const cx = (orb.position[0] + offset.x) * canvas.width;
      const cy = (orb.position[1] + offset.y) * canvas.height;
      const radius = orb.size * Math.max(canvas.width, canvas.height) * 0.65;

      // Radial gradient
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, orb.adjustedColor);
      gradient.addColorStop(0.7, orb.adjustedColorTransparent);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Grain overlay
    if (grainIntensity > 0) {
      renderGrain(ctx, canvas.width, canvas.height, grainIntensity);
    }

    animationId = requestAnimationFrame(render);
  }

  function setOrbs(configs: OrbRenderConfig[]): void {
    orbs = toInternalOrbs(configs);
  }

  return { mount, unmount, setOrbs, setBackground, setGrain, resize, start, stop, destroy };
}
```

### Blend Mode Mapping

CSS `mix-blend-mode` values map to Canvas `globalCompositeOperation`:

| CSS blend-mode | Canvas composite | Notes |
|----------------|-----------------|-------|
| `screen` | `screen` | Direct match (Chrome 109+) |
| `multiply` | `multiply` | Direct match |
| `overlay` | `overlay` | Direct match |
| `hard-light` | `hard-light` | Direct match |
| `soft-light` | `soft-light` | Direct match |
| `color-dodge` | `color-dodge` | Direct match |
| `normal` | `source-over` | Different name |

Modern browsers support CSS blend modes in Canvas `globalCompositeOperation` directly.

### Blur Strategy

Canvas `filter: blur()` is expensive. Better approaches:

1. **Downscale trick**: Render orbs at 1/4 resolution on an offscreen canvas, then draw scaled up to the visible canvas. The upscaling naturally blurs.

2. **Pre-blurred gradients**: Use wider, softer gradient color stops instead of sharp gradients + post-blur. Adjust the gradient curve to simulate blur.

3. **CSS filter on canvas element**: Apply `filter: blur(Npx)` to the `<canvas>` element itself via CSS. GPU-accelerated but applies uniformly to all orbs.

**Recommended: Option 3 (CSS filter on canvas) for uniform blur + Option 2 (gradient softness) for per-orb blur variation.**

### Drift Animation in Canvas

Instead of CSS keyframes, calculate drift position per frame. Offsets are **deterministic** — seeded from the orb's pre-computed `orbitParams` (derived from position/index), ensuring identical animation paths across renders for the same configuration:

```typescript
function calculateDriftOffset(orb: InternalOrb, time: number): { x: number; y: number } {
  const { amplitudeX, amplitudeY, duration, delay } = orb.orbitParams;
  const t = ((time / 1000 + delay) % duration) / duration;
  const angle = t * Math.PI * 2;

  return {
    x: Math.cos(angle) * amplitudeX / 100,
    y: Math.sin(angle) * amplitudeY / 100,
  };
}
```

### Grain in Canvas

Reuse the existing `<Grain>` component's noise generation logic, but render it on the same canvas:

```typescript
function renderGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.random() * 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = intensity * 128; // 0-0.5 * 255
  }

  ctx.globalCompositeOperation = 'overlay';
  ctx.putImageData(imageData, 0, 0);
}
```

Note: Grain regeneration every frame is expensive at full resolution. Optimization: generate grain once, cache the ImageData, and re-apply each frame. Only regenerate on resize.

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/renderers/canvas-renderer.ts` | Full implementation |
| `packages/core/src/renderers/renderer-interface.ts` | New — shared OrbRenderer interface |
| `packages/core/src/renderers/index.ts` | Re-export renderer interface |

## Testing

- Canvas creates and mounts a `<canvas>` element
- Orbs render as radial gradients
- Blend modes map correctly
- Drift animation updates positions over time
- Grain overlay renders with correct intensity
- Resize updates canvas dimensions
- Destroy cleans up animation frame and removes canvas
- Memory: no leaks after mount/unmount cycles

## Performance Targets

- 5 orbs @ 1080p: 60fps on mid-range devices
- 10 orbs @ 1080p: 30fps minimum
- Grain: cached ImageData, regenerated only on resize
