import type { BlendMode } from 'orbkit';
import type { JSX } from 'react';
import type { EditorAction, EditorOrb } from '../types';
import { ColorPicker } from './color-picker';
import { Slider } from './slider';

const BLEND_MODES: BlendMode[] = [
  'screen',
  'overlay',
  'multiply',
  'hard-light',
  'soft-light',
  'color-dodge',
  'normal',
  'lighten',
];

interface OrbControlsProps {
  orb: EditorOrb;
  dispatch: (action: EditorAction) => void;
}

/** Controls for the currently selected orb: color, size, blur, blend mode. */
export function OrbControls({ orb, dispatch }: OrbControlsProps): JSX.Element {
  const update = (changes: Partial<Omit<EditorOrb, 'id'>>) => {
    dispatch({ type: 'UPDATE_ORB', id: orb.id, changes });
  };

  return (
    <div className="orbkit-editor-orb-controls">
      <h3 className="orbkit-editor-section-title">Orb Settings</h3>

      <ColorPicker label="Color" value={orb.color} onChange={(color) => update({ color })} />

      <Slider
        label="Size"
        value={Math.round(orb.size * 100)}
        min={10}
        max={100}
        onChange={(v) => update({ size: v / 100 })}
      />

      <Slider
        label="Blur"
        value={orb.blur}
        min={0}
        max={100}
        onChange={(blur) => update({ blur })}
      />

      <Slider
        label="Opacity"
        value={Math.round(orb.opacity * 100)}
        min={10}
        max={100}
        onChange={(v) => update({ opacity: v / 100 })}
      />

      <label className="orbkit-editor-field">
        <span className="orbkit-editor-label">Blend Mode</span>
        <select
          value={orb.blendMode}
          onChange={(e) => update({ blendMode: e.target.value as BlendMode })}
          className="orbkit-editor-select"
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>

      <div className="orbkit-editor-toggle-group">
        <label className="orbkit-editor-toggle">
          <input
            type="checkbox"
            checked={orb.drift}
            onChange={(e) => update({ drift: e.target.checked })}
          />
          <span>Drift</span>
        </label>
        <label className="orbkit-editor-toggle">
          <input
            type="checkbox"
            checked={orb.wavy}
            onChange={(e) => update({ wavy: e.target.checked })}
          />
          <span>Wavy</span>
        </label>
        <label className="orbkit-editor-toggle">
          <input
            type="checkbox"
            checked={orb.interactive}
            onChange={(e) => update({ interactive: e.target.checked })}
          />
          <span>Interactive</span>
        </label>
      </div>
    </div>
  );
}
