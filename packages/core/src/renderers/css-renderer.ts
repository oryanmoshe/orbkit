import type { OrbProps } from '../types';
import { generateDriftKeyframeCSS, getOrbitParams } from '../utils/animation';
import { applySaturation } from '../utils/color';

/** CSS for a single orb's radial gradient */
export function generateOrbCSS(
  point: { color: string; position: [number, number]; radius: number },
  saturation: number,
): string {
  const adjustedColor = applySaturation(point.color, saturation);
  const [x, y] = point.position;
  return `radial-gradient(at ${x * 100}% ${y * 100}%, ${adjustedColor} 0%, transparent ${point.radius * 100}%)`;
}

/** Generate the full CSS background string for a theme */
export function generateGradientCSS(
  points: Array<{ color: string; position: [number, number]; radius: number }>,
  saturation: number,
): string {
  return points.map((point) => generateOrbCSS(point, saturation)).join(', ');
}

/** Map grain intensity (0-100) to canvas opacity (0-0.5) */
export function generateGrainIntensity(grain: number): number {
  return (grain / 100) * 0.5;
}

/** Generate a unique keyframe animation for an orb */
export function generateOrbAnimation(
  _props: OrbProps,
  index: number,
  breathing: number,
): { keyframeCSS: string; animationName: string; duration: number; delay: number } {
  const position = _props.position ?? [0.5, 0.5];
  const [x, y] = position;
  const orbit = getOrbitParams(x, y, index, breathing);
  const animationName = `orbkit-drift-${index}`;
  const keyframeCSS = generateDriftKeyframeCSS(animationName, orbit.amplitudeX, orbit.amplitudeY);

  return {
    keyframeCSS,
    animationName,
    duration: orbit.duration,
    delay: orbit.delay,
  };
}
