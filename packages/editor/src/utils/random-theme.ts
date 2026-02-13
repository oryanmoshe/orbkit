import type { EditorState } from '../types';

const BACKGROUNDS = [
  '#0a0a0a',
  '#1a1a1a',
  '#2E2D2C',
  '#3D1C1C',
  '#1a1018',
  '#2D1B4E',
  '#0f0f1a',
  '#0C2340',
  '#0f1a14',
  '#1a2e1a',
  '#1a1918',
  '#3B2F20',
];

function randomHex(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 40 + Math.floor(Math.random() * 60); // 40-100
  const l = 30 + Math.floor(Math.random() * 40); // 30-70
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Generate a random orb scene configuration. */
export function randomizeTheme(): EditorState {
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 orbs
  const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)] ?? '#0a0a0a';

  return {
    background: bg,
    saturation: 50 + Math.floor(Math.random() * 40),
    grain: 20 + Math.floor(Math.random() * 30),
    breathing: 15 + Math.floor(Math.random() * 35),
    orbs: Array.from({ length: count }, (_, i) => ({
      id: `orb-${i}`,
      color: randomHex(),
      position: [Math.random() * 0.8 + 0.1, Math.random() * 0.8 + 0.1] as [number, number],
      size: 0.5 + Math.random() * 0.5,
      blur: 30 + Math.random() * 40,
      blendMode: 'screen' as const,
    })),
    selectedOrbId: null,
    renderer: 'css',
  };
}
