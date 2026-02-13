import type { RendererType } from 'orbkit';
import type { JSX } from 'react';
import type { EditorAction, EditorState } from '../types';
import { ColorPicker } from './color-picker';
import { Slider } from './slider';

const RENDERERS: RendererType[] = ['css', 'canvas', 'webgl'];

interface SceneControlsProps {
  state: EditorState;
  dispatch: (action: EditorAction) => void;
}

/** Scene-level controls: background, saturation, grain, breathing, renderer. */
export function SceneControls({ state, dispatch }: SceneControlsProps): JSX.Element {
  return (
    <div className="orbkit-editor-scene-controls">
      <h3 className="orbkit-editor-section-title">Scene</h3>

      <ColorPicker
        label="Background"
        value={state.background}
        onChange={(color) => dispatch({ type: 'SET_BACKGROUND', color })}
      />

      <Slider
        label="Saturation"
        value={state.saturation}
        min={0}
        max={100}
        onChange={(value) => dispatch({ type: 'SET_SATURATION', value })}
      />

      <Slider
        label="Grain"
        value={state.grain}
        min={0}
        max={100}
        onChange={(value) => dispatch({ type: 'SET_GRAIN', value })}
      />

      <Slider
        label="Breathing"
        value={state.breathing}
        min={0}
        max={100}
        onChange={(value) => dispatch({ type: 'SET_BREATHING', value })}
      />

      <div className="orbkit-editor-field">
        <span className="orbkit-editor-label">Renderer</span>
        <div className="orbkit-editor-renderer-toggle">
          {RENDERERS.map((r) => (
            <button
              key={r}
              type="button"
              className={`orbkit-editor-renderer-btn${state.renderer === r ? ' orbkit-editor-renderer-btn--active' : ''}`}
              onClick={() => dispatch({ type: 'SET_RENDERER', renderer: r })}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
