# Plan 15: Hooks API (useOrbScene)

## Problem

The target API includes programmatic control:

```tsx
const scene = useOrbScene({ preset: 'ocean' });
scene.addOrb({ color: '#FF0000', position: [0.5, 0.5] });
scene.removeOrb('orb-id');
scene.setBreathing(50);
```

This gives developers full imperative control over orb scenes — useful for dynamic UIs, games, data-driven visualizations, and integration with other state management systems.

## Design

### Hook API

```typescript
interface UseOrbSceneOptions {
  preset?: string;
  background?: string;
  grain?: number;
  breathing?: number;
  renderer?: RendererType;
  orbs?: OrbConfig[];
}

interface OrbConfig {
  id?: string;          // Auto-generated if omitted
  color: string;
  position: Point;
  size?: number;
  blur?: number;
  blendMode?: BlendMode;
  drift?: boolean | DriftConfig;
  wavy?: boolean | WavyConfig;
  interactive?: boolean;
}

interface OrbSceneController {
  // Read state
  readonly orbs: ReadonlyArray<OrbConfig>;
  readonly background: string;
  readonly grain: number;
  readonly breathing: number;

  // Mutate state
  addOrb(config: OrbConfig): string;       // Returns orb ID
  removeOrb(id: string): void;
  updateOrb(id: string, changes: Partial<OrbConfig>): void;
  setBackground(color: string): void;
  setGrain(value: number): void;
  setBreathing(value: number): void;
  applyPreset(name: string): void;

  // Animation control
  pause(): void;
  resume(): void;
  reset(): void;

  // Render binding
  ref: RefCallback<HTMLElement>;           // Attach to container
  SceneComponent: React.FC<{ children?: ReactNode }>;  // Or use this
}
```

### Usage Patterns

#### Pattern 1: Ref-based (headless)

```tsx
function MyComponent() {
  const scene = useOrbScene({ preset: 'ocean' });

  return (
    <div ref={scene.ref} style={{ width: '100%', height: '400px' }}>
      <h1>Content on top of orbs</h1>
    </div>
  );
}
```

The hook mounts the renderer into the ref'd element.

#### Pattern 2: Component-based

```tsx
function MyComponent() {
  const scene = useOrbScene({ preset: 'ocean' });

  return (
    <scene.SceneComponent>
      <h1>Content on top of orbs</h1>
    </scene.SceneComponent>
  );
}
```

The hook returns a pre-configured `<OrbScene>` component.

#### Pattern 3: Dynamic orbs

```tsx
function DataViz({ data }) {
  const scene = useOrbScene({ background: '#0a0a0a' });

  useEffect(() => {
    // Map data points to orbs
    data.forEach(point => {
      scene.addOrb({
        color: point.color,
        position: [point.x, point.y],
        size: point.value / 100,
      });
    });
  }, [data]);

  return <div ref={scene.ref} />;
}
```

### Implementation

```typescript
// Monotonic counter for unique orb IDs — avoids collisions when
// multiple orbs are added within the same millisecond.
let nextOrbId = 0;

export default function useOrbScene(options: UseOrbSceneOptions = {}): OrbSceneController {
  const [state, dispatch] = useReducer(orbSceneReducer, options, initState);
  const containerRef = useRef<HTMLElement | null>(null);
  const rendererRef = useRef<OrbRenderer | null>(null);
  const currentRendererType = useRef<RendererType>(state.renderer);

  // Ref callback for mounting
  const ref = useCallback((el: HTMLElement | null) => {
    if (el && !rendererRef.current) {
      const renderer = createRenderer(state.renderer, el);
      rendererRef.current = renderer;
      currentRendererType.current = state.renderer;
      renderer.start();
    }
    containerRef.current = el;
  }, []);

  // Handle renderer type changes: tear down the old renderer and create a new
  // one on the existing container element. Separated from the ref callback so
  // we don't need to re-run the callback (and remount the DOM node) on every
  // renderer change.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // If the renderer type hasn't changed, nothing to do
    if (currentRendererType.current === state.renderer) return;

    // Destroy the old renderer before creating the new one
    rendererRef.current?.destroy();
    const renderer = createRenderer(state.renderer, el);
    rendererRef.current = renderer;
    currentRendererType.current = state.renderer;
    renderer.start();

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [state.renderer]);

  // Sync state to renderer
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setOrbs(state.orbs);
      rendererRef.current.setBackground(state.background);
      rendererRef.current.setGrain(state.grain);
    }
  }, [state]);

  // Cleanup
  useEffect(() => {
    return () => rendererRef.current?.destroy();
  }, []);

  const controller: OrbSceneController = {
    get orbs() { return state.orbs; },
    get background() { return state.background; },
    get grain() { return state.grain; },
    get breathing() { return state.breathing; },

    addOrb: (config) => {
      const id = config.id ?? `orb-${nextOrbId++}`;
      dispatch({ type: 'ADD_ORB', orb: { ...config, id } });
      return id;
    },
    removeOrb: (id) => dispatch({ type: 'REMOVE_ORB', id }),
    updateOrb: (id, changes) => dispatch({ type: 'UPDATE_ORB', id, changes }),
    setBackground: (color) => dispatch({ type: 'SET_BACKGROUND', color }),
    setGrain: (value) => dispatch({ type: 'SET_GRAIN', value }),
    setBreathing: (value) => dispatch({ type: 'SET_BREATHING', value }),
    applyPreset: (name) => dispatch({ type: 'APPLY_PRESET', name }),

    pause: () => rendererRef.current?.stop(),
    resume: () => rendererRef.current?.start(),
    reset: () => dispatch({ type: 'RESET', options }),

    ref,
    SceneComponent: useMemo(() => {
      return function BoundScene({ children }: { children?: ReactNode }) {
        return (
          <OrbScene {...stateToProps(state)}>
            {children}
          </OrbScene>
        );
      };
    }, [state]),
  };

  return controller;
}
```

## Files to Create

| File | Purpose |
|------|---------|
| `packages/core/src/hooks/use-orb-scene.ts` | Main hook |
| `packages/core/src/hooks/use-orb-scene-reducer.ts` | State reducer |
| `packages/core/src/hooks/index.ts` | Hook exports |

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/index.ts` | Export `useOrbScene` as default from hooks |

## Convention Note

Per CLAUDE.md: default exports for hooks, named exports for components. So:

```typescript
// packages/core/src/hooks/use-orb-scene.ts
export default function useOrbScene(...) { ... }

// Usage
import useOrbScene from 'orbkit/hooks'; // or from 'orbkit'
```

## Dependencies

- Requires [01-scene-context](./01-scene-context.md) — shares the OrbSceneContext type
- Requires [08-renderer-switching](./08-renderer-switching.md) for the `createRenderer` factory
- Works with CSS-only if Canvas/WebGL not yet implemented

## Testing

- Hook returns controller with correct initial state
- addOrb adds to internal orbs array
- removeOrb removes by ID
- updateOrb merges changes
- applyPreset loads preset data
- ref callback mounts renderer
- pause/resume control animation
- State changes sync to renderer
- Cleanup destroys renderer

## Open Questions

- Should `useOrbScene` return a stable reference (like React Query's queryClient)?
- Should orb IDs be user-provided or always auto-generated?
- Should the hook support animation timeline (play from time X to Y)?
