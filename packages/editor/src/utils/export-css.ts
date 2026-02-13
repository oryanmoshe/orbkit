import type { EditorState } from '../types';

/** Generate raw CSS for non-React use. */
export function exportCSS(state: EditorState): string {
  const lines: string[] = [
    '.orbkit-scene {',
    '  position: relative;',
    '  overflow: hidden;',
    '  width: 100%;',
    '  height: 100%;',
    `  background: ${state.background};`,
    '}',
    '',
  ];

  for (const [i, orb] of state.orbs.entries()) {
    const px = orb.position[0] * 100;
    const py = orb.position[1] * 100;
    lines.push(
      `.orbkit-orb-${i} {`,
      '  position: absolute;',
      '  width: 130%;',
      '  height: 130%;',
      '  top: -15%;',
      '  left: -15%;',
      `  background: radial-gradient(at ${px.toFixed(0)}% ${py.toFixed(0)}%, ${orb.color} 0%, transparent ${(orb.size * 100).toFixed(0)}%);`,
      `  filter: blur(${Math.round(orb.blur)}px);`,
      `  mix-blend-mode: ${orb.blendMode};`,
      '}',
      '',
    );
  }

  return lines.join('\n');
}
