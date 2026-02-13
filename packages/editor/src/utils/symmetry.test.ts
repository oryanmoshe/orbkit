import { describe, expect, it } from 'bun:test';
import { computeSymmetricalPositions } from './symmetry';

describe('computeSymmetricalPositions', () => {
  it('returns moved position for 1 orb', () => {
    const result = computeSymmetricalPositions([0.7, 0.3], 1, 0);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([0.7, 0.3]);
  });

  it('returns empty array for 0 orbs', () => {
    expect(computeSymmetricalPositions([0.5, 0.5], 0, 0)).toEqual([]);
  });

  it('places 2 orbs opposite each other', () => {
    const result = computeSymmetricalPositions([0.8, 0.5], 2, 0);
    expect(result).toHaveLength(2);
    const [a, b] = result;
    expect(a?.[0]).toBeCloseTo(0.8, 4);
    expect(a?.[1]).toBeCloseTo(0.5, 4);
    expect(b?.[0]).toBeCloseTo(0.2, 4);
    expect(b?.[1]).toBeCloseTo(0.5, 4);
  });

  it('places 3 orbs at 120-degree intervals', () => {
    const result = computeSymmetricalPositions([0.8, 0.5], 3, 0);
    expect(result).toHaveLength(3);
    const [a, b] = result;
    expect(a?.[0]).toBeCloseTo(0.8, 4);
    expect(a?.[1]).toBeCloseTo(0.5, 4);
    expect(b?.[0]).toBeCloseTo(0.5 + 0.3 * Math.cos((2 * Math.PI) / 3), 4);
    expect(b?.[1]).toBeCloseTo(0.5 + 0.3 * Math.sin((2 * Math.PI) / 3), 4);
  });

  it('places 4 orbs at 90-degree intervals', () => {
    const result = computeSymmetricalPositions([0.8, 0.5], 4, 0);
    expect(result).toHaveLength(4);
    const [a, b, c, d] = result;
    expect(a?.[0]).toBeCloseTo(0.8, 4);
    expect(a?.[1]).toBeCloseTo(0.5, 4);
    expect(b?.[0]).toBeCloseTo(0.5, 4);
    expect(b?.[1]).toBeCloseTo(0.8, 4);
    expect(c?.[0]).toBeCloseTo(0.2, 4);
    expect(c?.[1]).toBeCloseTo(0.5, 4);
    expect(d?.[0]).toBeCloseTo(0.5, 4);
    expect(d?.[1]).toBeCloseTo(0.2, 4);
  });

  it('handles non-first orb being dragged', () => {
    const result = computeSymmetricalPositions([0.8, 0.5], 2, 1);
    expect(result).toHaveLength(2);
    const [a, b] = result;
    expect(a?.[0]).toBeCloseTo(0.2, 4);
    expect(a?.[1]).toBeCloseTo(0.5, 4);
    expect(b?.[0]).toBeCloseTo(0.8, 4);
    expect(b?.[1]).toBeCloseTo(0.5, 4);
  });

  it('clamps positions to [0, 1]', () => {
    const result = computeSymmetricalPositions([1.0, 0.5], 2, 0);
    for (const pos of result) {
      expect(pos[0]).toBeGreaterThanOrEqual(0);
      expect(pos[0]).toBeLessThanOrEqual(1);
      expect(pos[1]).toBeGreaterThanOrEqual(0);
      expect(pos[1]).toBeLessThanOrEqual(1);
    }
  });
});
