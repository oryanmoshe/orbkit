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
    // Move orb 0 to the right of center
    const result = computeSymmetricalPositions([0.8, 0.5], 2, 0);
    expect(result).toHaveLength(2);
    const [a, b] = result;
    // Orb 0 at [0.8, 0.5], orb 1 at [0.2, 0.5] (opposite)
    expect(a?.[0]).toBeCloseTo(0.8, 4);
    expect(a?.[1]).toBeCloseTo(0.5, 4);
    expect(b?.[0]).toBeCloseTo(0.2, 4);
    expect(b?.[1]).toBeCloseTo(0.5, 4);
  });

  it('places 3 orbs at 120-degree intervals', () => {
    // Move orb 0 directly to the right
    const result = computeSymmetricalPositions([0.8, 0.5], 3, 0);
    expect(result).toHaveLength(3);
    const [a, b] = result;
    // Orb 0 is at angle 0 (right), radius 0.3
    expect(a?.[0]).toBeCloseTo(0.8, 4);
    expect(a?.[1]).toBeCloseTo(0.5, 4);
    // Orb 1 is at angle 120 degrees
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
    // Drag orb 1 (of 2) to the right — orb 0 should end up on the left
    const result = computeSymmetricalPositions([0.8, 0.5], 2, 1);
    expect(result).toHaveLength(2);
    const [a, b] = result;
    // Orb 0 should be opposite: left side
    expect(a?.[0]).toBeCloseTo(0.2, 4);
    expect(a?.[1]).toBeCloseTo(0.5, 4);
    // Orb 1 is the one we dragged
    expect(b?.[0]).toBeCloseTo(0.8, 4);
    expect(b?.[1]).toBeCloseTo(0.5, 4);
  });

  it('clamps positions to [0, 1]', () => {
    // Move far outside: radius larger than 0.5 from center
    const result = computeSymmetricalPositions([1.0, 0.5], 2, 0);
    for (const pos of result) {
      expect(pos[0]).toBeGreaterThanOrEqual(0);
      expect(pos[0]).toBeLessThanOrEqual(1);
      expect(pos[1]).toBeGreaterThanOrEqual(0);
      expect(pos[1]).toBeLessThanOrEqual(1);
    }
  });
});
