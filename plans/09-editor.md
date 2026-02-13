# Plan 09: Editor Package (@orbkit/editor)

## Problem

The editor package is a stub (exports only `EDITOR_VERSION`). The target is a drop-in visual editor component for designing orb scenes — inspired by DreamTeam.io's gradient theme editor, Haikei.app, and Rive's browser-based editor.

## Target API

```tsx
import { OrbEditor } from '@orbkit/editor';

// Standalone editor
<OrbEditor
  value={config}
  onChange={setConfig}
  presets={['ocean', 'sunset', 'aurora', ...customPresets]}
/>

// Editor connected to a live scene
const sceneRef = useRef();
<OrbScene ref={sceneRef} />
<OrbEditor target={sceneRef} />
```

## Editor Sections

Based on DreamTeam.io source and modern design tool patterns:

### 1. Preset Gallery
- Grid of preset thumbnails (mini preview of each preset)
- Click to apply preset as starting point
- Custom presets section (user-saved)
- "Randomize" button — generates random orb configuration

### 2. Canvas Preview
- Live rendering of the orb scene
- Draggable point handles for each orb (reposition by drag)
- Click empty area to add new orb
- Visual feedback: selected orb highlighted

### 3. Orb List / Selection
- List of current orbs with color swatch + name
- Click to select, drag to reorder
- Delete button per orb
- "Add orb" button

### 4. Selected Orb Controls
- **Color picker** — hex input + visual picker
- **Position** — X/Y sliders (or drag on canvas)
- **Size** — slider (0.1-1.0)
- **Blur** — slider (0-100px)
- **Blend mode** — dropdown (screen, overlay, multiply, hard-light, soft-light, color-dodge)

### 5. Scene Controls
- **Background color** — picker + preset swatches (12 dark colors from DreamTeam)
- **Saturation** — slider (0-100)
- **Grain** — slider (0-100)
- **Breathing** — slider (0-100)
- **Renderer** — toggle (CSS / Canvas / WebGL)

### 6. Export
- **Copy JSX** — generates `<OrbScene>` + `<Orb>` code
- **Copy JSON** — config object for programmatic use
- **Copy CSS** — raw CSS variables/gradients for non-React use
- **Download** — JSON file export

## Component Architecture

```text
@orbkit/editor
  src/
    index.ts                    — public exports
    orb-editor.tsx              — main editor component
    components/
      preset-gallery.tsx        — preset thumbnails + randomize
      canvas-preview.tsx        — live preview with draggable handles
      orb-list.tsx              — orb selection list
      orb-controls.tsx          — color/size/blur/blend controls for selected orb
      scene-controls.tsx        — background/saturation/grain/breathing
      export-panel.tsx          — copy JSX/JSON/CSS buttons
    hooks/
      use-editor-state.ts       — central state management (reducer)
      use-drag.ts               — drag interaction for canvas handles
      use-color-picker.ts       — color picker state
    utils/
      export-jsx.ts             — generate JSX string from config
      export-json.ts            — serialize config
      export-css.ts             — generate raw CSS
      random-theme.ts           — randomize orb configuration
    types.ts                    — editor-specific types
```

### State Management

Use `useReducer` for predictable state updates:

```typescript
interface EditorState {
  background: string;
  saturation: number;
  grain: number;
  breathing: number;
  orbs: EditorOrb[];
  selectedOrbId: string | null;
  renderer: RendererType;
}

interface EditorOrb {
  id: string;
  color: string;
  position: Point;
  size: number;
  blur: number;
  blendMode: BlendMode;
}

type EditorAction =
  | { type: 'SET_BACKGROUND'; color: string }
  | { type: 'SET_SATURATION'; value: number }
  | { type: 'SET_GRAIN'; value: number }
  | { type: 'SET_BREATHING'; value: number }
  | { type: 'SELECT_ORB'; id: string }
  | { type: 'ADD_ORB'; orb: EditorOrb }
  | { type: 'REMOVE_ORB'; id: string }
  | { type: 'UPDATE_ORB'; id: string; changes: Partial<EditorOrb> }
  | { type: 'MOVE_ORB'; id: string; position: Point }
  | { type: 'APPLY_PRESET'; preset: Preset }
  | { type: 'RANDOMIZE' }
  | { type: 'LOAD_CONFIG'; config: EditorState };
```

### Controlled vs Uncontrolled

The editor supports both patterns:

```tsx
// Uncontrolled — internal state
<OrbEditor defaultValue={initialConfig} />

// Controlled — external state
<OrbEditor value={config} onChange={setConfig} />
```

### Controlled Mode State Sync

When `value` is provided, the editor operates in **controlled mode**. The internal reducer state must stay in sync with the external `value` prop:

1. **Initialization**: The reducer is initialized from `value` (or `defaultValue` if uncontrolled).
2. **External updates**: A `useEffect` watches the `value` prop and replaces internal state whenever it changes, using a `LOAD_CONFIG` action.
3. **Dispatch behavior**: In controlled mode, dispatching an action updates internal state *and* calls `onChange` with the new state. The parent is the source of truth — if the parent doesn't update `value`, the editor reverts on the next render.

```typescript
function useEditorState(value?: EditorState, defaultValue?: EditorState, onChange?: (state: EditorState) => void) {
  const [state, dispatch] = useReducer(editorReducer, value ?? defaultValue ?? initialState);
  const isControlled = value !== undefined;

  // Sync internal state from controlled value prop
  useEffect(() => {
    if (isControlled) {
      dispatch({ type: 'LOAD_CONFIG', config: value });
    }
  }, [value, isControlled]);

  // Wrap dispatch to call onChange in controlled mode
  const stableDispatch = useCallback((action: EditorAction) => {
    if (isControlled) {
      // Compute next state and pass to parent; don't update internal state directly
      const nextState = editorReducer(value, action);
      onChange?.(nextState);
    } else {
      dispatch(action);
    }
  }, [isControlled, value, onChange]);

  return [isControlled ? value : state, stableDispatch] as const;
}
```

Key rules:
- **Controlled**: `onChange` is the only way state changes propagate. The reducer is not applied internally -- the parent decides.
- **Uncontrolled**: Internal `dispatch` applies the reducer directly. `onChange` is not called.
- **Switching modes** (controlled to uncontrolled or vice versa) at runtime is unsupported and logs a warning, matching React's own convention.

### Canvas Preview with Drag

The preview renders a live `<OrbScene>` with absolutely positioned drag handles:

```tsx
function CanvasPreview({ state, dispatch }) {
  return (
    <div className="orbkit-editor-preview">
      <OrbScene
        background={state.background}
        grain={state.grain / 100}
        breathing={state.breathing}
      >
        {state.orbs.map(orb => (
          <Orb key={orb.id} {...orb} />
        ))}
      </OrbScene>

      {/* Drag handles overlay */}
      {state.orbs.map(orb => (
        <DragHandle
          key={orb.id}
          position={orb.position}
          selected={orb.id === state.selectedOrbId}
          color={orb.color}
          onDrag={(pos) => dispatch({ type: 'MOVE_ORB', id: orb.id, position: pos })}
          onClick={() => dispatch({ type: 'SELECT_ORB', id: orb.id })}
        />
      ))}
    </div>
  );
}
```

### Color Picker

**Zero-dependency requirement**: Can't use react-color or similar. Options:

1. **Native `<input type="color">`** — simple, works everywhere, limited UX
2. **Custom HSL picker** — canvas-based hue ring + saturation/lightness square. More work but better UX.
3. **Hybrid** — `<input type="color">` with a hex text input next to it

**Recommended: Option 3 (hybrid)** for v1. Custom picker can come later.

```tsx
function ColorPicker({ value, onChange }) {
  return (
    <div className="orbkit-editor-color-picker">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
```

### Randomize Algorithm

From DreamTeam source:
- Generate 3-5 random orbs
- Colors: HSL with S: 40-100, L: 30-70 (vibrant but not neon)
- Positions: distributed across the canvas (avoid clustering)
- Sizes: 0.5-1.0 range
- Background: random from the 12 dark color swatches

```typescript
function randomizeTheme(): EditorState {
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 orbs
  const backgrounds = ['#0a0a0a', '#1a1a1a', '#2E2D2C', '#3D1C1C', '#1a1018',
    '#2D1B4E', '#0f0f1a', '#0C2340', '#0f1a14', '#1a2e1a', '#1a1918', '#3B2F20'];

  return {
    background: backgrounds[Math.floor(Math.random() * backgrounds.length)],
    saturation: 50 + Math.floor(Math.random() * 40),
    grain: 20 + Math.floor(Math.random() * 30),
    breathing: 15 + Math.floor(Math.random() * 35),
    orbs: Array.from({ length: count }, (_, i) => ({
      id: `orb-${i}`,
      color: randomHex(),
      position: [Math.random() * 0.8 + 0.1, Math.random() * 0.8 + 0.1] as Point,
      size: 0.5 + Math.random() * 0.5,
      blur: 30 + Math.random() * 40,
      blendMode: 'screen' as BlendMode,
    })),
    selectedOrbId: null,
    renderer: 'css',
  };
}
```

### JSX Export

```typescript
function exportJSX(state: EditorState): string {
  const orbLines = state.orbs.map(orb =>
    `  <Orb color="${orb.color}" position={[${orb.position[0].toFixed(2)}, ${orb.position[1].toFixed(2)}]} size={${orb.size.toFixed(2)}} blur={${orb.blur}} blendMode="${orb.blendMode}" drift />`
  ).join('\n');

  return `<OrbScene background="${state.background}" grain={${(state.grain / 100).toFixed(2)}} breathing={${state.breathing}}>
${orbLines}
</OrbScene>`;
}
```

## Styling

Zero styling dependencies per project rules. The editor ships CSS class names:

```
.orbkit-editor { }
.orbkit-editor-preview { }
.orbkit-editor-controls { }
.orbkit-editor-color-picker { }
.orbkit-editor-slider { }
.orbkit-editor-preset-gallery { }
.orbkit-editor-export { }
```

Consumers can import `@orbkit/editor/styles.css` for sensible defaults or style from scratch.

## Dependencies

- Requires `orbkit` core package (peer dependency) — for `<OrbScene>`, `<Orb>`, presets, types
- Zero additional runtime dependencies

## Files to Create

All files under `packages/editor/src/` as listed in Component Architecture above.

## Testing

- Editor renders all sections
- Preset selection updates preview
- Drag handle moves orb position
- Color picker updates orb color
- Slider changes reflect in preview
- Add/remove orb updates state
- Export JSX generates valid code
- Export JSON is parseable and re-importable
- Randomize produces valid configurations
- Controlled mode calls onChange on every state change
- Uncontrolled mode manages internal state

## Open Questions

- Should the editor support undo/redo? (useReducer makes this easy with a history stack)
- Should the editor have a "compare" mode (before/after)?
- Should we ship a default CSS theme or require consumers to style everything?
- Should the editor be embeddable in the docs site as an interactive playground?
