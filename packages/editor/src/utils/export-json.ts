import type { EditorState } from '../types';

/** Serialize editor state to a JSON string. */
export function exportJSON(state: EditorState): string {
  return JSON.stringify(
    {
      background: state.background,
      saturation: state.saturation,
      grain: state.grain,
      breathing: state.breathing,
      renderer: state.renderer,
      orbs: state.orbs.map((orb) => ({
        color: orb.color,
        position: orb.position,
        size: orb.size,
        blur: orb.blur,
        blendMode: orb.blendMode,
      })),
    },
    null,
    2,
  );
}
