import type { EditorState } from '../types';

/** Generate a JSX code string from the editor state. */
export function exportJSX(state: EditorState): string {
  const orbLines = state.orbs
    .map((orb) => {
      let line = `  <Orb color="${orb.color}" position={[${orb.position[0].toFixed(2)}, ${orb.position[1].toFixed(2)}]} size={${orb.size.toFixed(2)}} blur={${Math.round(orb.blur)}}`;
      if (orb.opacity !== 1) line += ` style={{ opacity: ${orb.opacity.toFixed(2)} }}`;
      line += ` blendMode="${orb.blendMode}"`;
      if (orb.drift) line += ' drift';
      if (orb.wavy) line += ' wavy';
      if (orb.interactive) line += ' interactive';
      line += ' />';
      return line;
    })
    .join('\n');

  return `<OrbScene background="${state.background}" grain={${(state.grain / 100).toFixed(2)}} breathing={${state.breathing}} saturation={${state.saturation}}>
${orbLines}
</OrbScene>`;
}
