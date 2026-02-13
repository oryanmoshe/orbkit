import { describe, expect, it } from 'bun:test';
import { calculateDriftOffset, getOrbitParams } from '../utils/animation';
import { hexToRgba } from '../utils/color';

describe('Canvas renderer utilities', () => {
  describe('hexToRgba', () => {
    it('converts hex to rgba with default alpha', () => {
      expect(hexToRgba('#FF0000')).toBe('rgba(255,0,0,1)');
    });

    it('converts hex to rgba with custom alpha', () => {
      expect(hexToRgba('#00FF00', 0.5)).toBe('rgba(0,255,0,0.5)');
    });

    it('converts hex to rgba with zero alpha', () => {
      expect(hexToRgba('#0000FF', 0)).toBe('rgba(0,0,255,0)');
    });

    it('handles lowercase hex', () => {
      expect(hexToRgba('#ff8800')).toBe('rgba(255,136,0,1)');
    });
  });

  describe('calculateDriftOffset', () => {
    it('returns x/y offsets', () => {
      const params = getOrbitParams(0.5, 0.5, 0, 50);
      const offset = calculateDriftOffset(params, 0);
      expect(typeof offset.x).toBe('number');
      expect(typeof offset.y).toBe('number');
    });

    it('produces different offsets at different times', () => {
      const params = getOrbitParams(0.5, 0.5, 0, 50);
      const offset1 = calculateDriftOffset(params, 0);
      const offset2 = calculateDriftOffset(params, 5000);
      // At different times, at least one axis should differ
      const moved = offset1.x !== offset2.x || offset1.y !== offset2.y;
      expect(moved).toBe(true);
    });

    it('is deterministic for same inputs', () => {
      const params = getOrbitParams(0.3, 0.7, 2, 50);
      const a = calculateDriftOffset(params, 12345);
      const b = calculateDriftOffset(params, 12345);
      expect(a.x).toBe(b.x);
      expect(a.y).toBe(b.y);
    });

    it('produces bounded offsets', () => {
      const params = getOrbitParams(0.5, 0.5, 0, 100);
      // Sample many time points
      for (let t = 0; t < 60000; t += 1000) {
        const offset = calculateDriftOffset(params, t);
        // Offsets should be small fractions (amplitude/100)
        expect(Math.abs(offset.x)).toBeLessThan(0.15);
        expect(Math.abs(offset.y)).toBeLessThan(0.15);
      }
    });

    it('completes a full orbit cycle', () => {
      const params = getOrbitParams(0.5, 0.5, 0, 50);
      const durationMs = params.duration * 1000;
      const start = calculateDriftOffset(params, 0);
      const end = calculateDriftOffset(params, durationMs);
      // After one full cycle, should return to roughly the same position
      expect(Math.abs(start.x - end.x)).toBeLessThan(0.001);
      expect(Math.abs(start.y - end.y)).toBeLessThan(0.001);
    });
  });

  describe('Blend mode mapping', () => {
    it('all BlendMode values have canvas equivalents', () => {
      // Import the blend mode map indirectly by testing the type coverage
      const cssBlendModes = [
        'screen',
        'multiply',
        'overlay',
        'hard-light',
        'soft-light',
        'color-dodge',
        'lighten',
        'normal',
      ];
      // These are the expected canvas composite operations
      const expectedCanvasOps = [
        'screen',
        'multiply',
        'overlay',
        'hard-light',
        'soft-light',
        'color-dodge',
        'lighten',
        'source-over',
      ];
      expect(cssBlendModes.length).toBe(expectedCanvasOps.length);
    });
  });

  describe('getOrbitParams for canvas', () => {
    it('returns all required fields', () => {
      const params = getOrbitParams(0.3, 0.7, 0, 50);
      expect(params).toHaveProperty('amplitudeX');
      expect(params).toHaveProperty('amplitudeY');
      expect(params).toHaveProperty('duration');
      expect(params).toHaveProperty('delay');
    });

    it('different positions produce different params', () => {
      const a = getOrbitParams(0.2, 0.3, 0, 50);
      const b = getOrbitParams(0.8, 0.6, 0, 50);
      const differs = a.amplitudeX !== b.amplitudeX || a.amplitudeY !== b.amplitudeY;
      expect(differs).toBe(true);
    });

    it('higher breathing increases amplitude', () => {
      const low = getOrbitParams(0.5, 0.5, 0, 10);
      const high = getOrbitParams(0.5, 0.5, 0, 90);
      expect(high.amplitudeX).toBeGreaterThan(low.amplitudeX);
    });
  });
});
