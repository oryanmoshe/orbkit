import { describe, expect, it, mock } from 'bun:test';
import type { BlendMode } from '../types';
import { BLEND_MODE_INDEX, createWebGLRenderer, hexToVec3 } from './webgl-renderer';

describe('WebGL renderer utilities', () => {
  describe('hexToVec3', () => {
    it('converts hex to vec3 floats (0-1)', () => {
      const [r, g, b] = hexToVec3('#FF0000');
      expect(r).toBeCloseTo(1.0);
      expect(g).toBeCloseTo(0.0);
      expect(b).toBeCloseTo(0.0);
    });

    it('converts mixed hex colors', () => {
      const [r, g, b] = hexToVec3('#80FF40');
      expect(r).toBeCloseTo(128 / 255);
      expect(g).toBeCloseTo(1.0);
      expect(b).toBeCloseTo(64 / 255);
    });

    it('handles lowercase hex', () => {
      const [r, g, b] = hexToVec3('#ff8800');
      expect(r).toBeCloseTo(1.0);
      expect(g).toBeCloseTo(136 / 255);
      expect(b).toBeCloseTo(0.0);
    });

    it('returns black for short hex strings', () => {
      expect(hexToVec3('#FFF')).toEqual([0, 0, 0]);
    });

    it('returns black for invalid hex', () => {
      expect(hexToVec3('#ZZZZZZ')).toEqual([0, 0, 0]);
    });

    it('handles hex without # prefix', () => {
      const [r, g, b] = hexToVec3('0000FF');
      expect(r).toBeCloseTo(0.0);
      expect(g).toBeCloseTo(0.0);
      expect(b).toBeCloseTo(1.0);
    });
  });

  describe('BLEND_MODE_INDEX', () => {
    it('maps all 8 BlendMode values to unique indices', () => {
      const blendModes: BlendMode[] = [
        'screen',
        'multiply',
        'overlay',
        'hard-light',
        'soft-light',
        'color-dodge',
        'lighten',
        'normal',
      ];
      const indices = new Set(blendModes.map((mode) => BLEND_MODE_INDEX[mode]));
      // All 8 modes should produce unique indices
      expect(indices.size).toBe(8);
    });

    it('uses indices 0-7', () => {
      const values = Object.values(BLEND_MODE_INDEX);
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(7);
      }
    });

    it('maps screen to 0 (default in shader)', () => {
      expect(BLEND_MODE_INDEX.screen).toBe(0);
    });

    it('maps normal to 7', () => {
      expect(BLEND_MODE_INDEX.normal).toBe(7);
    });
  });

  describe('Orb count clamping', () => {
    it('should warn when more than 8 orbs are provided', () => {
      const warnSpy = mock(() => {});
      const originalWarn = console.warn;
      console.warn = warnSpy;

      // Stub document so createWebGLRenderer doesn't fall back to canvas
      const originalDoc = globalThis.document;
      globalThis.document = {} as Document;

      const renderer = createWebGLRenderer();
      renderer.setOrbs(
        Array.from({ length: 9 }, (_, i) => ({
          id: `orb-${i}`,
          color: '#FF0000',
          position: [0.5, 0.5] as [number, number],
          size: 0.3,
          blur: 20,
          blendMode: 'screen' as const,
          drift: false,
          wavy: false,
          interactive: false,
        })),
      );

      expect(warnSpy).toHaveBeenCalled();

      console.warn = originalWarn;
      globalThis.document = originalDoc;
    });
  });
});
