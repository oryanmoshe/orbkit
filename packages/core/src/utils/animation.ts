import type { OrbitParams } from '../types';

/** Base animation duration in seconds */
const MAX_DURATION = 40;
const MIN_DURATION = 6;
const MIN_AMPLITUDE = 2;
const MAX_AMPLITUDE = 10;

/**
 * Generate a deterministic seed from a position.
 * Each point gets a unique but reproducible orbit.
 */
function positionSeed(x: number, y: number): number {
  return x * 1000 + y * 7919;
}

/**
 * Simple seeded pseudo-random number generator.
 * Returns a value between 0 and 1.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Calculate orbit parameters for a drift animation.
 * Each orb gets a deterministic elliptical path based on its position.
 *
 * @param x - Normalized x position (0-1)
 * @param y - Normalized y position (0-1)
 * @param index - Orb index in the scene (affects duration/delay)
 * @param breathing - Global animation intensity 0-100
 */
export function getOrbitParams(
  x: number,
  y: number,
  index: number,
  breathing: number,
): OrbitParams {
  const seed = positionSeed(x, y);
  const rand1 = seededRandom(seed);
  const rand2 = seededRandom(seed + 1);

  const breathingFactor = breathing / 100;
  const amplitudeRange = MAX_AMPLITUDE - MIN_AMPLITUDE;

  const amplitudeX = MIN_AMPLITUDE + rand1 * amplitudeRange * breathingFactor;
  const amplitudeY = MIN_AMPLITUDE + rand2 * amplitudeRange * breathingFactor;

  const durationRange = MAX_DURATION - MIN_DURATION;
  const baseDuration = MIN_DURATION + (1 - breathingFactor) * durationRange;

  // Each successive orb is 30% slower for visual depth
  const duration = baseDuration * (1 + index * 0.3);

  // Staggered start for organic feel
  const delay = index * -baseDuration * 0.25;

  return { amplitudeX, amplitudeY, duration, delay };
}

/**
 * Generate CSS keyframe values for an elliptical drift orbit.
 *
 * Returns an array of 9 keyframe stops (0% through 100%)
 * using the 8-step elliptical path from the source implementation.
 */
export function generateDriftKeyframes(
  amplitudeX: number,
  amplitudeY: number,
): Array<{ offset: number; transform: string }> {
  const cos45 = Math.SQRT1_2;

  return [
    { offset: 0, transform: `translate(${amplitudeX}%, 0)` },
    { offset: 0.125, transform: `translate(${amplitudeX * cos45}%, ${amplitudeY * cos45}%)` },
    { offset: 0.25, transform: `translate(0, ${amplitudeY}%)` },
    { offset: 0.375, transform: `translate(${-amplitudeX * cos45}%, ${amplitudeY * cos45}%)` },
    { offset: 0.5, transform: `translate(${-amplitudeX}%, 0)` },
    { offset: 0.625, transform: `translate(${-amplitudeX * cos45}%, ${-amplitudeY * cos45}%)` },
    { offset: 0.75, transform: `translate(0, ${-amplitudeY}%)` },
    { offset: 0.875, transform: `translate(${amplitudeX * cos45}%, ${-amplitudeY * cos45}%)` },
    { offset: 1, transform: `translate(${amplitudeX}%, 0)` },
  ];
}

/**
 * Calculate the drift offset for a given time (frame-based, for canvas/webgl).
 * Uses the same elliptical path as CSS keyframes but evaluated per-frame.
 *
 * @param params - Pre-computed orbit parameters
 * @param timeMs - Current time in milliseconds (e.g. from rAF)
 * @returns Normalized x/y offset (percentage / 100)
 */
export function calculateDriftOffset(
  params: OrbitParams,
  timeMs: number,
): { x: number; y: number } {
  const { amplitudeX, amplitudeY, duration, delay } = params;
  if (duration <= 0) return { x: 0, y: 0 };
  const timeSec = timeMs / 1000;
  const t = (((timeSec + delay) % duration) + duration) % duration;
  const angle = (t / duration) * Math.PI * 2;

  return {
    x: (Math.cos(angle) * amplitudeX) / 100,
    y: (Math.sin(angle) * amplitudeY) / 100,
  };
}

/**
 * Generate a CSS @keyframes string for an elliptical drift orbit.
 */
export function generateDriftKeyframeCSS(name: string, ax: number, ay: number): string {
  const cos45 = Math.SQRT1_2;

  return `@keyframes ${name} {
  0% { transform: translate(${ax}%, 0); }
  12.5% { transform: translate(${ax * cos45}%, ${ay * cos45}%); }
  25% { transform: translate(0, ${ay}%); }
  37.5% { transform: translate(${-ax * cos45}%, ${ay * cos45}%); }
  50% { transform: translate(${-ax}%, 0); }
  62.5% { transform: translate(${-ax * cos45}%, ${-ay * cos45}%); }
  75% { transform: translate(0, ${-ay}%); }
  87.5% { transform: translate(${ax * cos45}%, ${-ay * cos45}%); }
  100% { transform: translate(${ax}%, 0); }
}`;
}
