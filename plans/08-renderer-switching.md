# Plan 08: Renderer Switching

## Problem

The `renderer` prop exists on both `<OrbScene>` and `<Orb>` but does nothing. Need a system to select between CSS, Canvas, and WebGL renderers at runtime.

## Design

### Selection Hierarchy

```
Per-orb renderer prop > Scene renderer prop > Auto-detection
```

1. If `<Orb renderer="webgl">` is set, use WebGL for that orb
2. If `<OrbScene renderer="canvas">` is set, use Canvas for all orbs (unless overridden)
3. If neither is set, auto-detect: WebGL > Canvas > CSS

### Auto-Detection

```typescript
function detectBestRenderer(): RendererType {
  if (typeof document === 'undefined') return 'css'; // SSR

  // Try WebGL
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (gl) return 'webgl';

  // Try Canvas
  const ctx = testCanvas.getContext('2d');
  if (ctx) return 'canvas';

  // Fallback
  return 'css';
}
```

### Rendering Strategy per Renderer

| Renderer | DOM Structure | Animation | Grain |
|----------|--------------|-----------|-------|
| CSS | N `<div>` elements per orb | CSS `@keyframes` | Separate `<canvas>` |
| Canvas | 1 `<canvas>` for all orbs | requestAnimationFrame | Same canvas |
| WebGL | 1 `<canvas>` for all orbs | requestAnimationFrame (shader uniforms) | Same shader |

### Mixed Renderer Challenge

If different orbs use different renderers, we need multiple rendering surfaces:

```tsx
<OrbScene>
  <Orb renderer="css" />   → rendered as <div>
  <Orb renderer="webgl" /> → rendered into shared <canvas>
</OrbScene>
```

**Decision: Don't support mixed renderers in v1.** The scene renderer applies to all orbs. Per-orb `renderer` prop is deferred. This dramatically simplifies the implementation — one rendering path per scene.

### Component Architecture

```tsx
function OrbScene({ renderer = 'auto', ...props }) {
  const resolvedRenderer = renderer === 'auto' ? detectBestRenderer() : renderer;

  if (resolvedRenderer === 'css') {
    return <CSSScene {...props} />;
  }

  // Canvas and WebGL use imperative renderers
  return <ImperativeScene renderer={resolvedRenderer} {...props} />;
}
```

**CSSScene**: Current approach — renders `<div>` per orb with CSS animations.

**ImperativeScene**: Mounts a `<canvas>`, creates the renderer instance, and syncs React props to the imperative API:

```tsx
function ImperativeScene({ renderer, orbs, background, grain, breathing, children }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<OrbRenderer | null>(null);

  useEffect(() => {
    const factory = renderer === 'webgl' ? createWebGLRenderer : createCanvasRenderer;
    rendererRef.current = factory({ canvas: canvasRef.current! });
    rendererRef.current.start();
    return () => rendererRef.current?.destroy();
  }, [renderer]);

  // Sync orbs to renderer
  useEffect(() => {
    rendererRef.current?.setOrbs(orbConfigs);
  }, [orbConfigs]);

  return (
    <div className="orbkit-scene">
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      {children} {/* Content rendered on top */}
    </div>
  );
}
```

### Collecting Orb Props for Imperative Renderers

For Canvas/WebGL, child `<Orb>` components don't render DOM elements. Instead, they register their config with the scene via context:

```tsx
// Orb component for imperative renderers
function Orb(props: OrbProps) {
  const { registerOrb, unregisterOrb, rendererType } = useOrbSceneContext();

  useEffect(() => {
    if (rendererType !== 'css') {
      const id = registerOrb(props);
      return () => unregisterOrb(id);
    }
  }, [props]);

  // CSS renderer: return <div>
  if (rendererType === 'css') {
    return <div className="orbkit-orb" style={...} />;
  }

  // Canvas/WebGL: render nothing (orb data is in the renderer)
  return null;
}
```

## Files to Create

| File | Purpose |
|------|---------|
| `packages/core/src/renderers/renderer-interface.ts` | Shared OrbRenderer interface |
| `packages/core/src/renderers/detect.ts` | Auto-detection utility |
| `packages/core/src/components/imperative-scene.tsx` | Canvas/WebGL scene wrapper |

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/components/orb-scene.tsx` | Route to CSS vs imperative scene |
| `packages/core/src/components/orb.tsx` | Render null for imperative renderers |
| `packages/core/src/context/orb-scene-context.ts` | Add rendererType, registerOrb, unregisterOrb |

## Dependencies

- Requires [01-scene-context](./01-scene-context.md)
- Requires [06-canvas-renderer](./06-canvas-renderer.md) and/or [07-webgl-renderer](./07-webgl-renderer.md)

## Testing

- Auto-detection returns correct renderer type
- CSS renderer: orbs render as `<div>` elements
- Canvas/WebGL: orbs render into `<canvas>`, `<Orb>` returns null
- Renderer prop cascades from scene to orbs
- Renderer switch triggers cleanup of old renderer and creation of new one
- SSR: always falls back to CSS
