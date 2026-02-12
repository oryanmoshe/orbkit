# Plan 01: OrbScene Context

## Problem

`<OrbScene>` currently renders a plain wrapper `<div>`. Child `<Orb>` components can't access scene-level settings (background, grain, breathing, renderer, preset). Each orb works in isolation — there's no composition.

The target API requires:
```tsx
<OrbScene background="#0f0f1a" grain={0.35} breathing={30}>
  <Orb color="#7C3AED" position={[0.2, 0.25]} />
  <Orb color="#06B6D4" position={[0.75, 0.5]} />
</OrbScene>
```

Where grain, breathing, and renderer flow down to children automatically.

## Current State

- `orb-scene.tsx`: Renders `<div>` with background color + className. Props `_preset`, `_grain`, `_breathing`, `_renderer` are accepted but unused (prefixed with `_`).
- `orb.tsx`: Renders `<div>` with radial-gradient. Props `_drift`, `_wavy`, `_interactive`, `_renderer` are accepted but unused.
- No React context exists.

## Design

### Context Shape

```typescript
// types.ts — add to existing types
interface OrbSceneContext {
  background: string;
  grain: number;          // 0-1
  breathing: number;      // 0-100
  renderer: RendererType; // 'css' | 'canvas' | 'webgl'
  saturation: number;     // 0-100 (from preset or prop)
}
```

### New Files

```
packages/core/src/
  context/
    orb-scene-context.ts   — createContext + provider + useOrbScene hook
    index.ts               — re-exports
```

### Implementation

1. **Create `OrbSceneContext`** with `createContext<OrbSceneContext | null>(null)`
2. **Create `useOrbSceneContext()` hook** — returns context or throws if used outside `<OrbScene>`
3. **Update `<OrbScene>`** to wrap children in the context provider, passing down scene settings
4. **Auto-inject `<Grain>`** when `grain > 0` — render `<Grain intensity={grain} />` as last child
5. **Update `<Orb>`** to read breathing/renderer from context as defaults (prop overrides context)
6. **Track orb index** — each `<Orb>` needs its index within the scene for animation staggering. Use a ref counter in the context provider.

### Orb Index Strategy

Each `<Orb>` calls a `registerOrb()` function from context on mount, receiving its index. This enables:
- Staggered animation delays (`index * -baseDuration * 0.25`)
- Progressive duration increase (`duration *= (1 + index * 0.3)`)

```typescript
// Inside OrbScene provider
const orbCountRef = useRef(0);

const registerOrb = useCallback(() => {
  const index = orbCountRef.current;
  orbCountRef.current += 1;
  return index;
}, []);

const unregisterOrb = useCallback(() => {
  orbCountRef.current -= 1;
}, []);
```

### Auto-Grain Injection

When `grain > 0`, `<OrbScene>` automatically renders `<Grain intensity={grain} />` as the last child, so users don't need to manually add it:

```tsx
// Inside OrbScene render
return createElement(Element, props,
  children,
  grain > 0 ? <Grain intensity={grain} /> : null
);
```

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/context/orb-scene-context.ts` | New — context + hook |
| `packages/core/src/context/index.ts` | New — re-exports |
| `packages/core/src/components/orb-scene.tsx` | Wrap in provider, auto-inject grain |
| `packages/core/src/components/orb.tsx` | Read context for defaults |
| `packages/core/src/types.ts` | Add `OrbSceneContext` interface |
| `packages/core/src/index.ts` | Export `useOrbSceneContext` |

## Testing

- Scene provides context values to child orbs
- Orb reads breathing/renderer from context when not explicitly set
- Orb prop overrides context value
- Grain auto-injected when grain > 0
- Grain not rendered when grain = 0
- Orb index increments per mount
- Orb outside scene works standalone (no context required)

## Open Questions

- Should `saturation` be a scene-level prop or only come from presets?
- Should the context expose a `preset` object for children to read?
