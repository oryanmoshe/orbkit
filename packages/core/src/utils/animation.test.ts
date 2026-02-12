import { describe, expect, it } from 'bun:test';
import { generateDriftKeyframeCSS, generateDriftKeyframes, getOrbitParams } from './animation';

describe('getOrbitParams', () => {
  it('should return deterministic params for same position', () => {
    const a = getOrbitParams(0.5, 0.5, 0, 50);
    const b = getOrbitParams(0.5, 0.5, 0, 50);
    expect(a).toEqual(b);
  });

  it('should return different params for different positions', () => {
    const a = getOrbitParams(0.2, 0.3, 0, 50);
    const b = getOrbitParams(0.8, 0.7, 0, 50);
    expect(a.amplitudeX).not.toBe(b.amplitudeX);
  });

  it('should increase duration with index', () => {
    const a = getOrbitParams(0.5, 0.5, 0, 50);
    const b = getOrbitParams(0.5, 0.5, 3, 50);
    expect(b.duration).toBeGreaterThan(a.duration);
  });

  it('should have negative delay for index > 0', () => {
    const params = getOrbitParams(0.5, 0.5, 2, 50);
    expect(params.delay).toBeLessThan(0);
  });

  it('should have zero amplitude at zero breathing', () => {
    const params = getOrbitParams(0.5, 0.5, 0, 0);
    expect(params.amplitudeX).toBe(2);
    expect(params.amplitudeY).toBe(2);
  });
});

describe('generateDriftKeyframes', () => {
  it('should return 9 keyframe stops', () => {
    const keyframes = generateDriftKeyframes(5, 3);
    expect(keyframes).toHaveLength(9);
  });

  it('should start and end at same position', () => {
    const keyframes = generateDriftKeyframes(5, 3);
    expect(keyframes[0]?.transform).toBe(keyframes[8]?.transform);
  });

  it('should have offset 0 at start and 1 at end', () => {
    const keyframes = generateDriftKeyframes(5, 3);
    expect(keyframes[0]?.offset).toBe(0);
    expect(keyframes[8]?.offset).toBe(1);
  });
});

describe('generateDriftKeyframeCSS', () => {
  it('should produce valid CSS @keyframes', () => {
    const css = generateDriftKeyframeCSS('test-drift', 5, 3);
    expect(css).toContain('@keyframes test-drift');
    expect(css).toContain('0%');
    expect(css).toContain('100%');
  });

  it('should include the animation name', () => {
    const css = generateDriftKeyframeCSS('my-orb', 4, 6);
    expect(css).toContain('@keyframes my-orb');
  });
});
