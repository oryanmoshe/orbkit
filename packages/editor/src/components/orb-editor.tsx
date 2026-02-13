import type { JSX } from 'react';
import useEditorState from '../hooks/use-editor-state';
import type { EditorState } from '../types';
import { CanvasPreview } from './canvas-preview';
import { ExportPanel } from './export-panel';
import { OrbControls } from './orb-controls';
import { OrbList } from './orb-list';
import { PresetGallery } from './preset-gallery';
import { SceneControls } from './scene-controls';

interface OrbEditorProps {
  /** Controlled mode: current editor state. */
  value?: EditorState;
  /** Controlled mode: called on every state change. */
  onChange?: (state: EditorState) => void;
  /** Uncontrolled mode: initial state. */
  defaultValue?: EditorState;
  /** Additional CSS class name. */
  className?: string;
}

/**
 * OrbEditor — Visual editor for designing orbkit scenes.
 *
 * Supports controlled (value/onChange) and uncontrolled (defaultValue) patterns.
 * Renders a live preview with draggable orb handles and control panels.
 */
export function OrbEditor({
  value,
  onChange,
  defaultValue,
  className,
}: OrbEditorProps): JSX.Element {
  const [state, dispatch] = useEditorState(value, defaultValue, onChange);

  const selectedOrb = state.selectedOrbId
    ? state.orbs.find((o) => o.id === state.selectedOrbId)
    : undefined;

  return (
    <div className={className ? `orbkit-editor ${className}` : 'orbkit-editor'}>
      <div className="orbkit-editor-main">
        <CanvasPreview state={state} dispatch={dispatch} />
      </div>

      <div className="orbkit-editor-sidebar">
        <PresetGallery dispatch={dispatch} />

        <OrbList orbs={state.orbs} selectedOrbId={state.selectedOrbId} dispatch={dispatch} />

        {selectedOrb && <OrbControls orb={selectedOrb} dispatch={dispatch} />}

        <SceneControls state={state} dispatch={dispatch} />

        <ExportPanel state={state} />
      </div>
    </div>
  );
}
