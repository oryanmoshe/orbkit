import { describe, expect, it } from 'bun:test';
import { applySaturation, hexToHsl, hslToHex } from './color';

describe('hexToHsl', () => {
  it('should convert pure red', () => {
    const hsl = hexToHsl('#ff0000');
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it('should convert pure white', () => {
    const hsl = hexToHsl('#ffffff');
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(100);
  });

  it('should convert pure black', () => {
    const hsl = hexToHsl('#000000');
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(0);
  });

  it('should handle hex without #', () => {
    const hsl = hexToHsl('ff0000');
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });
});

describe('hslToHex', () => {
  it('should convert red HSL to hex', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000');
  });

  it('should convert achromatic (gray)', () => {
    const hex = hslToHex(0, 0, 50);
    expect(hex).toBe('#808080');
  });

  it('should convert white', () => {
    expect(hslToHex(0, 0, 100)).toBe('#ffffff');
  });

  it('should convert black', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000');
  });
});

describe('hexToHsl and hslToHex roundtrip', () => {
  it('should roundtrip a color', () => {
    const original = '#4a90d9';
    const hsl = hexToHsl(original);
    const result = hslToHex(hsl.h, hsl.s, hsl.l);
    expect(result).toBe(original);
  });
});

describe('applySaturation', () => {
  it('should desaturate to grayscale at 0', () => {
    const result = applySaturation('#ff0000', 0);
    const hsl = hexToHsl(result);
    expect(hsl.s).toBe(0);
  });

  it('should preserve hue and lightness', () => {
    const original = hexToHsl('#4a90d9');
    const result = hexToHsl(applySaturation('#4a90d9', 50));
    expect(result.h).toBeCloseTo(original.h, 0);
    expect(result.l).toBeCloseTo(original.l, 0);
    expect(result.s).toBeCloseTo(50, 0);
  });
});
