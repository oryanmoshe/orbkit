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

/** Simple seeded PRNG (mulberry32). */
function createRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomHex(rng: () => number): string {
  const h = Math.floor(rng() * 360);
  const s = 40 + Math.floor(rng() * 60); // 40-100
  const l = 30 + Math.floor(rng() * 40); // 30-70
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

/** Generate a random orb scene configuration. Accepts an optional seed for deterministic output. */
export function randomizeTheme(seed?: number): EditorState {
  const rng = createRng(seed ?? Date.now() ^ (Math.random() * 0xffffffff));
  const count = 3 + Math.floor(rng() * 3); // 3-5 orbs
  const bg = BACKGROUNDS[Math.floor(rng() * BACKGROUNDS.length)] ?? '#0a0a0a';

  return {
    background: bg,
    saturation: 50 + Math.floor(rng() * 40),
    grain: 20 + Math.floor(rng() * 30),
    breathing: 15 + Math.floor(rng() * 35),
    locked: false,
    orbs: Array.from({ length: count }, (_, i) => ({
      id: `orb-${i}`,
      color: randomHex(rng),
      position: [rng() * 0.8 + 0.1, rng() * 0.8 + 0.1] as [number, number],
      size: 0.5 + rng() * 0.5,
      blur: 30 + rng() * 40,
      opacity: 0.8,
      blendMode: 'screen' as const,
      drift: true,
      wavy: false,
      interactive: false,
    })),
    selectedOrbId: null,
    renderer: 'css',
  };
}
