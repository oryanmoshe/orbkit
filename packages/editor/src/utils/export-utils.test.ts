import { describe, expect, test } from 'bun:test';
import type { EditorState } from '../types';
import { exportCSS } from './export-css';
import { exportJSON } from './export-json';
import { exportJSX } from './export-jsx';
import { randomizeTheme } from './random-theme';

const SAMPLE_STATE: EditorState = {
  background: '#0a0a0a',
  saturation: 80,
  grain: 30,
  breathing: 20,
  locked: false,
  renderer: 'css',
  selectedOrbId: null,
  orbs: [
    {
      id: 'orb-1',
      color: '#ff6633',
      position: [0.3, 0.7],
      size: 0.6,
      blur: 40,
      blendMode: 'screen',
      drift: true,
      wavy: false,
      interactive: false,
    },
    {
      id: 'orb-2',
      color: '#3366ff',
      position: [0.8, 0.2],
      size: 0.8,
      blur: 50,
      blendMode: 'overlay',
      drift: true,
      wavy: false,
      interactive: false,
    },
  ],
};

describe('exportJSX', () => {
  test('generates valid OrbScene JSX', () => {
    const jsx = exportJSX(SAMPLE_STATE);
    expect(jsx).toContain('<OrbScene');
    expect(jsx).toContain('</OrbScene>');
    expect(jsx).toContain('background="#0a0a0a"');
  });

  test('includes all orbs', () => {
    const jsx = exportJSX(SAMPLE_STATE);
    expect(jsx).toContain('<Orb');
    expect(jsx).toContain('color="#ff6633"');
    expect(jsx).toContain('color="#3366ff"');
  });

  test('includes position, size, blur, blendMode', () => {
    const jsx = exportJSX(SAMPLE_STATE);
    expect(jsx).toContain('position={[0.30, 0.70]}');
    expect(jsx).toContain('size={0.60}');
    expect(jsx).toContain('blur={40}');
    expect(jsx).toContain('blendMode="screen"');
    expect(jsx).toContain('drift');
  });

  test('includes grain, breathing, saturation', () => {
    const jsx = exportJSX(SAMPLE_STATE);
    expect(jsx).toContain('grain={0.30}');
    expect(jsx).toContain('breathing={20}');
    expect(jsx).toContain('saturation={80}');
  });

  test('handles empty orbs', () => {
    const jsx = exportJSX({ ...SAMPLE_STATE, orbs: [] });
    expect(jsx).toContain('<OrbScene');
    expect(jsx).toContain('</OrbScene>');
    expect(jsx).not.toContain('<Orb ');
  });
});

describe('exportJSON', () => {
  test('produces valid JSON', () => {
    const json = exportJSON(SAMPLE_STATE);
    const parsed = JSON.parse(json);
    expect(parsed).toBeDefined();
  });

  test('strips id and selectedOrbId', () => {
    const json = exportJSON(SAMPLE_STATE);
    const parsed = JSON.parse(json);
    expect(parsed.selectedOrbId).toBeUndefined();
    for (const orb of parsed.orbs) {
      expect(orb.id).toBeUndefined();
    }
  });

  test('preserves all scene properties', () => {
    const json = exportJSON(SAMPLE_STATE);
    const parsed = JSON.parse(json);
    expect(parsed.background).toBe('#0a0a0a');
    expect(parsed.saturation).toBe(80);
    expect(parsed.grain).toBe(30);
    expect(parsed.breathing).toBe(20);
    expect(parsed.renderer).toBe('css');
  });

  test('preserves orb properties', () => {
    const json = exportJSON(SAMPLE_STATE);
    const parsed = JSON.parse(json);
    expect(parsed.orbs).toHaveLength(2);
    expect(parsed.orbs[0].color).toBe('#ff6633');
    expect(parsed.orbs[0].position).toEqual([0.3, 0.7]);
    expect(parsed.orbs[0].size).toBe(0.6);
    expect(parsed.orbs[0].blur).toBe(40);
    expect(parsed.orbs[0].blendMode).toBe('screen');
  });
});

describe('exportCSS', () => {
  test('generates .orbkit-scene class', () => {
    const css = exportCSS(SAMPLE_STATE);
    expect(css).toContain('.orbkit-scene');
    expect(css).toContain('background: #0a0a0a');
  });

  test('generates class per orb', () => {
    const css = exportCSS(SAMPLE_STATE);
    expect(css).toContain('.orbkit-orb-0');
    expect(css).toContain('.orbkit-orb-1');
  });

  test('includes radial-gradient with position', () => {
    const css = exportCSS(SAMPLE_STATE);
    expect(css).toContain('radial-gradient(at 30% 70%');
    expect(css).toContain('#ff6633');
  });

  test('includes blur and blend mode', () => {
    const css = exportCSS(SAMPLE_STATE);
    expect(css).toContain('filter: blur(40px)');
    expect(css).toContain('mix-blend-mode: screen');
    expect(css).toContain('filter: blur(50px)');
    expect(css).toContain('mix-blend-mode: overlay');
  });

  test('handles empty orbs', () => {
    const css = exportCSS({ ...SAMPLE_STATE, orbs: [] });
    expect(css).toContain('.orbkit-scene');
    expect(css).not.toContain('.orbkit-orb-');
  });
});

describe('randomizeTheme', () => {
  test('generates 3-5 orbs', () => {
    for (let i = 0; i < 20; i++) {
      const theme = randomizeTheme();
      expect(theme.orbs.length).toBeGreaterThanOrEqual(3);
      expect(theme.orbs.length).toBeLessThanOrEqual(5);
    }
  });

  test('produces valid hex colors', () => {
    const theme = randomizeTheme();
    expect(theme.background).toMatch(/^#[0-9a-fA-F]{6}$/);
    for (const orb of theme.orbs) {
      expect(orb.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test('positions are in valid range', () => {
    const theme = randomizeTheme();
    for (const orb of theme.orbs) {
      expect(orb.position[0]).toBeGreaterThanOrEqual(0.1);
      expect(orb.position[0]).toBeLessThanOrEqual(0.9);
      expect(orb.position[1]).toBeGreaterThanOrEqual(0.1);
      expect(orb.position[1]).toBeLessThanOrEqual(0.9);
    }
  });

  test('sizes are in valid range', () => {
    const theme = randomizeTheme();
    for (const orb of theme.orbs) {
      expect(orb.size).toBeGreaterThanOrEqual(0.5);
      expect(orb.size).toBeLessThanOrEqual(1.0);
    }
  });

  test('saturation, grain, breathing are in valid ranges', () => {
    for (let i = 0; i < 10; i++) {
      const theme = randomizeTheme();
      expect(theme.saturation).toBeGreaterThanOrEqual(50);
      expect(theme.saturation).toBeLessThanOrEqual(89);
      expect(theme.grain).toBeGreaterThanOrEqual(20);
      expect(theme.grain).toBeLessThanOrEqual(49);
      expect(theme.breathing).toBeGreaterThanOrEqual(15);
      expect(theme.breathing).toBeLessThanOrEqual(49);
    }
  });

  test('each orb has unique id', () => {
    const theme = randomizeTheme();
    const ids = theme.orbs.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('selectedOrbId is null', () => {
    const theme = randomizeTheme();
    expect(theme.selectedOrbId).toBeNull();
  });

  test('renderer defaults to css', () => {
    const theme = randomizeTheme();
    expect(theme.renderer).toBe('css');
  });
});
