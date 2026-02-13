# Plan 04: Interactive Hover Effects

## Problem

The `interactive` prop on `<Orb>` is accepted but not implemented. Interactive orbs respond to mouse movement — the gradient center follows the cursor, creating a magnetic/parallax effect.

## Design

### Interaction Modes

1. **Parallax follow** (default) — Orb position shifts slightly toward cursor. Subtle, ambient.
2. **Magnetic pull** — Orb stretches/distorts toward cursor when nearby. More dramatic.
3. **Hover glow** — Orb brightness/saturation increases on hover. Simplest.

Start with **parallax follow** as the default `interactive={true}` behavior. Allow `interactive={{ mode: 'magnetic' | 'parallax' | 'glow' }}` for explicit choice.

### InteractiveConfig

```typescript
interface InteractiveConfig {
  mode?: 'parallax' | 'magnetic' | 'glow';
  intensity?: number;  // 0-1, default 0.15
  radius?: number;     // Effect radius in px, default: Infinity (entire scene)
}
```

### Parallax Implementation

Track mouse position relative to the scene container. Each orb calculates an offset based on distance from its center to the cursor:

```typescript
// Hook: useMouseParallax
function useMouseParallax(
  containerRef: RefObject<HTMLElement>,
  position: Point,
  intensity: number
) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;   // 0-1
      const mouseY = (e.clientY - rect.top) / rect.height;   // 0-1

      const dx = mouseX - position[0];
      const dy = mouseY - position[1];

      setOffset({
        x: dx * intensity * 100,  // percentage offset
        y: dy * intensity * 100,
      });
    };

    const handlePointerLeave = () => setOffset({ x: 0, y: 0 });

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [containerRef, position, intensity]);

  return offset;
}
```

Applied to the orb's transform:

```typescript
const interactiveTransform = interactive
  ? `translate(${offset.x}%, ${offset.y}%)`
  : '';

// Combined with drift animation
style.transform = interactiveTransform;
```

### Performance: Avoiding Per-Orb Re-renders

The `useMouseParallax` hook above uses `useState` to store the offset, which triggers a React re-render on every pointer move for each interactive orb. With multiple orbs, this creates N re-renders per frame.

**Optimization for v1 or later:** Use a single scene-level `pointermove` listener with `requestAnimationFrame` batching. Instead of `setState`, write offsets directly to DOM via refs or CSS custom properties:

```typescript
// Scene-level: single listener, no React re-renders
const handlePointerMove = (e: PointerEvent) => {
  if (rafId.current) return; // throttle to one update per frame
  rafId.current = requestAnimationFrame(() => {
    const rect = container.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;
    // Update CSS custom properties on the scene container
    container.style.setProperty('--mouse-x', String(mouseX));
    container.style.setProperty('--mouse-y', String(mouseY));
    rafId.current = null;
  });
};
```

Each orb reads `--mouse-x`/`--mouse-y` via CSS `calc()` in its transform, requiring zero React re-renders. This is the preferred approach when multiple interactive orbs exist in the same scene.

### Scene Container Ref

The parallax hook needs a ref to the scene container for mouse position calculation. This comes from the scene context:

```typescript
// Add to OrbSceneContext
interface OrbSceneContext {
  // ... existing
  containerRef: RefObject<HTMLElement>;
}
```

### Smooth Transitions

Use CSS `transition` for smooth mouse-follow rather than instant jumps:

```css
.orbkit-orb--interactive {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

When drift animation is also active, use `will-change: transform` and separate the parallax offset into a wrapper element to avoid conflicting with the keyframe animation.

### Drift + Interactive Conflict Resolution

If both `drift` and `interactive` are true, they both want to control `transform`. Solutions:

1. **Wrapper div** — Drift animates the outer div, parallax transforms the inner div
2. **CSS custom properties** — `--drift-x`, `--drift-y`, `--mouse-x`, `--mouse-y`, combined in a single `transform: translate(calc(var(--drift-x) + var(--mouse-x)), ...)`
3. **Additive transforms** — Web Animations API composite mode

**Recommended: Wrapper div** — Simplest, most compatible:

```tsx
<div className="orbkit-orb-drift" style={driftAnimationStyle}>
  <div className="orbkit-orb" style={{ ...gradientStyle, ...mouseOffsetStyle }}>
  </div>
</div>
```

## Files to Create

| File | Purpose |
|------|---------|
| `packages/core/src/hooks/use-mouse-parallax.ts` | Mouse position tracking + offset calculation |
| `packages/core/src/hooks/index.ts` | Hook re-exports |

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/components/orb.tsx` | Apply parallax offset, wrapper div for drift+interactive |
| `packages/core/src/types.ts` | Add InteractiveConfig |
| `packages/core/src/context/orb-scene-context.ts` | Add containerRef |

## Dependencies

- Requires [01-scene-context](./01-scene-context.md) for containerRef
- Works independently of drift (just simpler without wrapper)

## Testing

- Mouse move within scene updates orb transform
- Mouse leave resets offset to 0
- Intensity prop scales the effect
- Interactive orb outside a scene still works (tracks its own mouse events)
- Drift + interactive renders wrapper div structure
- Transition is smooth (verify CSS transition property exists)

## Mobile Considerations

- Using `pointermove`/`pointerleave` (instead of `mousemove`/`mouseleave`) provides built-in touch and stylus support without separate touch event handling
- Consider `@media (hover: none)` to disable parallax on touch-only devices
- Alternative: use device orientation API for tilt-based parallax on mobile
