# Plan 05: Preset Resolution

## Problem

`<OrbScene preset="ocean">` is accepted but the preset is never resolved into actual orbs. The target API should auto-render a complete animated scene from a single preset name.

## Target

```tsx
// This single line should render a full animated background:
<OrbScene preset="ocean" />

// Equivalent to:
<OrbScene background="#1a1a1a" grain={0.35} breathing={30}>
  <Orb color="#4A90D9" position={[0.2, 0.25]} size={0.8} blur={40} drift />
  <Orb color="#D9654A" position={[0.65, 0.35]} size={0.75} blur={60} drift />
  <Orb color="#F5E6D3" position={[0.45, 0.85]} size={0.7} blur={50} drift />
</OrbScene>
```

## Design

### Resolution Logic

When `preset` prop is provided:
1. Look up preset from the presets record by name
2. Extract `backgroundColor`, `saturation`, `grain`, `breathing`, `points[]`
3. Map points to `<Orb>` components with drift enabled by default
4. Merge any explicit props over preset values (e.g., `<OrbScene preset="ocean" breathing={50}>` uses 50 instead of preset's 30)

### Implementation in OrbScene

```tsx
function OrbScene({ preset, background, grain, breathing, children, ...rest }) {
  const presetData = preset ? presets[preset] : null;

  const resolvedBackground = background ?? presetData?.backgroundColor ?? '#000000';
  const resolvedGrain = grain ?? (presetData ? presetData.grain / 100 : 0);
  const resolvedBreathing = breathing ?? presetData?.breathing ?? 0;
  const resolvedSaturation = presetData?.saturation ?? 70;

  // Auto-generated orbs from preset
  const presetOrbs = presetData?.points.map((point, index) => (
    <Orb
      key={point.id}
      color={point.color}
      position={[point.position.x, point.position.y]}
      size={point.radius}
      blur={40 + index * 10}
      drift
    />
  ));

  return (
    <OrbSceneProvider value={{ ... }}>
      <Element className="orbkit-scene" style={{ backgroundColor: resolvedBackground }}>
        {presetOrbs}
        {children}
        {resolvedGrain > 0 && <Grain intensity={resolvedGrain} />}
      </Element>
    </OrbSceneProvider>
  );
}
```

### Preset + Children Composition

Users can add extra orbs on top of a preset:

```tsx
<OrbScene preset="ocean">
  <Orb color="#FF0000" position={[0.5, 0.5]} size={0.5} />
</OrbScene>
```

This renders the preset's 3 orbs + the custom red orb. Preset orbs render first (background layer), custom children render on top.

### Point Position Format

Current preset data uses `{ x, y }` objects but the `<Orb>` component expects `[x, y]` tuples. The resolution layer handles this mapping:

```typescript
position={[point.position.x, point.position.y]}
```

Consider also supporting object format in `<Orb>` directly, or convert presets to tuple format.

### Custom Presets

Users should be able to register custom presets:

```typescript
import { registerPreset, Preset } from 'orbkit';

const myPreset: Preset = {
  name: 'corporate',
  backgroundColor: '#0a0a2e',
  points: [...],
  saturation: 60,
  grain: 20,
  breathing: 15,
};

registerPreset(myPreset);

// Then use:
<OrbScene preset="corporate" />
```

Implementation: A mutable Map alongside the built-in presets record.

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/components/orb-scene.tsx` | Preset resolution + auto-orb generation |
| `packages/core/src/presets/index.ts` | Add `registerPreset()`, convert to Map-based registry |
| `packages/core/src/types.ts` | Update Preset type if point position format changes |
| `packages/core/src/index.ts` | Export `registerPreset` |

## Dependencies

- Requires [01-scene-context](./01-scene-context.md) — scene must provide context for auto-generated orbs
- Requires [02-drift-animation](./02-drift-animation.md) — preset orbs should have drift enabled by default

## Testing

- `preset="ocean"` renders 3 orbs with correct colors/positions
- Explicit props override preset values (breathing, grain, background)
- Preset + children: custom orbs render alongside preset orbs
- Invalid preset name: graceful fallback (render children only, no error)
- Custom preset registration works
- Preset orbs have drift enabled by default
- Grain auto-injected from preset's grain value

## Open Questions

- Should presets support `wavy` and `interactive` flags per-point?
- Should preset blur values be configurable or derived from position/index?
- Should we ship a `getPresetConfig(name)` utility for consumers who want preset data without rendering?
