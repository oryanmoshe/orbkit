import type { JSX } from 'react';
import type { EditorAction, EditorOrb } from '../types';

interface OrbListProps {
  orbs: EditorOrb[];
  selectedOrbId: string | null;
  dispatch: (action: EditorAction) => void;
}

/** Orb selection list with color swatches, select, and delete. */
export function OrbList({ orbs, selectedOrbId, dispatch }: OrbListProps): JSX.Element {
  const addOrb = () => {
    const id = `orb-${Date.now()}`;
    dispatch({
      type: 'ADD_ORB',
      orb: {
        id,
        color: `#${Math.floor(Math.random() * 0xffffff)
          .toString(16)
          .padStart(6, '0')}`,
        position: [0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4],
        size: 0.5 + Math.random() * 0.3,
        blur: 30 + Math.random() * 30,
        blendMode: 'screen',
      },
    });
  };

  return (
    <div className="orbkit-editor-orb-list">
      <div className="orbkit-editor-orb-list-header">
        <h3 className="orbkit-editor-section-title">Orbs</h3>
        <button type="button" className="orbkit-editor-btn orbkit-editor-btn--add" onClick={addOrb}>
          + Add
        </button>
      </div>
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className={`orbkit-editor-orb-item${orb.id === selectedOrbId ? ' orbkit-editor-orb-item--selected' : ''}`}
        >
          <button
            type="button"
            className="orbkit-editor-orb-item-select"
            onClick={() => dispatch({ type: 'SELECT_ORB', id: orb.id })}
          >
            <span className="orbkit-editor-orb-swatch" style={{ backgroundColor: orb.color }} />
            <span className="orbkit-editor-orb-name">{orb.color}</span>
          </button>
          <button
            type="button"
            className="orbkit-editor-btn orbkit-editor-btn--delete"
            onClick={() => dispatch({ type: 'REMOVE_ORB', id: orb.id })}
            aria-label={`Remove orb ${orb.color}`}
          >
            ×
          </button>
        </div>
      ))}
      {orbs.length === 0 && (
        <p className="orbkit-editor-hint">No orbs yet. Click "+ Add" to create one.</p>
      )}
    </div>
  );
}
