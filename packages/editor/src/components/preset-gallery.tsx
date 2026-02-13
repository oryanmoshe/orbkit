import { type Preset, presets } from 'orbkit';
import type { JSX } from 'react';
import type { EditorAction, EditorOrb } from '../types';
import { randomizeTheme } from '../utils/random-theme';

interface PresetGalleryProps {
  dispatch: (action: EditorAction) => void;
}

/** Grid of preset thumbnails with randomize button. */
export function PresetGallery({ dispatch }: PresetGalleryProps): JSX.Element {
  const presetEntries = Object.entries(presets);

  const applyPreset = (preset: Preset) => {
    dispatch({
      type: 'APPLY_PRESET',
      config: {
        background: preset.backgroundColor,
        saturation: preset.saturation,
        grain: preset.grain,
        breathing: preset.breathing,
        orbs: preset.points.map(
          (pt, i): EditorOrb => ({
            id: `preset-${i}`,
            color: pt.color,
            position: pt.position,
            size: pt.radius,
            blur: 40,
            blendMode: 'screen',
            drift: true,
            wavy: false,
            interactive: false,
          }),
        ),
      },
    });
  };

  const handleRandomize = () => {
    dispatch({ type: 'RANDOMIZE', config: randomizeTheme() });
  };

  return (
    <div className="orbkit-editor-presets">
      <div className="orbkit-editor-presets-header">
        <h3 className="orbkit-editor-section-title">Presets</h3>
        <button
          type="button"
          className="orbkit-editor-btn orbkit-editor-btn--randomize"
          onClick={handleRandomize}
        >
          Randomize
        </button>
      </div>
      <div className="orbkit-editor-preset-grid">
        {presetEntries.map(([name, preset]) => (
          <button
            key={name}
            type="button"
            className="orbkit-editor-preset-thumb"
            onClick={() => applyPreset(preset)}
            title={name}
            style={{ background: preset.backgroundColor }}
          >
            {preset.points.map((pt) => (
              <span
                key={`${pt.color}-${pt.position[0]}-${pt.position[1]}`}
                className="orbkit-editor-preset-dot"
                style={{
                  backgroundColor: pt.color,
                  left: `${pt.position[0] * 100}%`,
                  top: `${pt.position[1] * 100}%`,
                  width: `${pt.radius * 40}%`,
                  height: `${pt.radius * 40}%`,
                }}
              />
            ))}
            <span className="orbkit-editor-preset-name">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
