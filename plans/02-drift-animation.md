# Plan 02: Drift Animation

## Problem

The animation math is fully implemented (`getOrbitParams`, `generateDriftKeyframes`, `generateDriftKeyframeCSS`) but never wired to the `<Orb>` component. The `drift` prop is accepted but ignored.

## Current State

- `animation.ts`: Complete. Generates deterministic orbit params from position + index, produces 8-step elliptical keyframes.
- `css-renderer.ts`: `generateOrbAnimation()` exists — takes props, index, breathing and returns `{keyframeCSS, animationName, duration, delay}`.
- `orb.tsx`: `_drift` prop unused. No keyframe injection, no animation styles applied.

## Design

### CSS Keyframe Injection Strategy

CSS `@keyframes` must exist in the document for animation to work. Options:

1. **Style tag injection** — Inject a `<style>` tag with the keyframes into the document head. Use a global registry to avoid duplicates.
2. **Inline keyframes via Web Animations API** — Use `element.animate()` with keyframe objects directly. No CSS injection needed.
3. **CSS-in-JS via `CSSStyleSheet`** — Use `document.adoptedStyleSheets` to add keyframes programmatically.

**Recommended: Option 1 (style tag injection)** — Most compatible, SSR-friendly (keyframes can be serialized), no runtime dependency.

### Keyframe Registry

A module-level `Set<string>` tracks which animation names have been injected. Each orb checks before injecting:

```typescript
// utils/keyframe-registry.ts
const injectedKeyframes = new Set<string>();

export function injectKeyframes(name: string, css: string): void {
  if (injectedKeyframes.has(name)) return;
  if (typeof document === 'undefined') return; // SSR guard

  const style = document.createElement('style');
  style.setAttribute('data-orbkit', name);
  style.textContent = css;
  document.head.appendChild(style);
  injectedKeyframes.add(name);
}

export function removeKeyframes(name: string): void {
  const el = document.querySelector(`style[data-orbkit="${name}"]`);
  if (el) el.remove();
  injectedKeyframes.delete(name);
}
```

### Orb Integration

Animation variables (`animationName`, `duration`, `delay`) are computed inside `useEffect` but needed in the render scope for inline styles. Store them in state so the render has access:

```tsx
// Inside <Orb> component
const [animationProps, setAnimationProps] = useState<{
  animationName: string;
  duration: number;
  delay: number;
} | null>(null);

useEffect(() => {
  if (!drift) {
    setAnimationProps(null);
    return;
  }

  const { keyframeCSS, animationName, duration, delay } = generateOrbAnimation(
    { color, position, size },
    orbIndex,    // from scene context
    breathing    // from scene context or prop
  );

  injectKeyframes(animationName, keyframeCSS);
  setAnimationProps({ animationName, duration, delay });

  return () => removeKeyframes(animationName);
}, [drift, position, breathing, orbIndex]);
```

The animation is applied via inline style using the stored state:

```typescript
const animationStyle = animationProps ? {
  animation: `${animationProps.animationName} ${animationProps.duration}s linear infinite`,
  animationDelay: `${animationProps.delay}s`,
} : {};
```

### DriftConfig Support

The `drift` prop accepts `boolean | DriftConfig`:

```typescript
// If drift={true}, use defaults from breathing
// If drift={{ speed: 0.5, amplitude: 20 }}, override specific params
const driftConfig = typeof drift === 'object' ? drift : {};
const speed = driftConfig.speed ?? 1;
const amplitude = driftConfig.amplitude ?? undefined; // use breathing-derived default
```

## Files to Create

| File | Purpose |
|------|---------|
| `packages/core/src/utils/keyframe-registry.ts` | Style tag injection + dedup |

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/components/orb.tsx` | Wire drift via useEffect + inline animation style |
| `packages/core/src/types.ts` | Ensure DriftConfig has speed/amplitude/direction |
| `packages/core/src/index.ts` | Export keyframe utilities if needed |

## Dependencies

- Requires [01-scene-context](./01-scene-context.md) for `orbIndex` and `breathing` from context.
- Can work standalone (without scene) using prop-provided values.

## Testing

- Orb with `drift={true}` injects a `<style>` tag into document head
- Orb with `drift={false}` has no animation
- Style tag is removed on unmount
- Duplicate animation names don't create duplicate style tags
- DriftConfig overrides (speed, amplitude) affect generated keyframes
- Animation stagger increases with orb index
- Breathing=0 produces zero-amplitude animation (no visible movement)

## SSR Considerations

- `injectKeyframes` uses `document.head` — must be guarded with `typeof document !== 'undefined'`
- During SSR, keyframes won't be injected. The animation simply won't play until hydration.
- Future: Could collect keyframe CSS during render and emit as a `<style>` block in the SSR output.
