import { type JSX, useEffect, useMemo, useState } from 'react';
import { useOrbSceneContext } from '../context';
import { generateOrbAnimation } from '../renderers/css-renderer';
import type { OrbProps } from '../types';
import { injectKeyframes, removeKeyframes } from '../utils/keyframe-registry';

/**
 * Orb — An individual animated orb primitive.
 *
 * Can be used inside an OrbScene for composed backgrounds,
 * or standalone for individual orb effects. When inside an
 * OrbScene, inherits breathing/renderer from context.
 */
export function Orb({
  color,
  position = [0.5, 0.5],
  size = 0.75,
  blur = 40,
  blendMode = 'screen',
  wavy: _wavy,
  drift,
  renderer: _renderer,
  interactive: _interactive,
  className,
  style,
}: OrbProps): JSX.Element {
  const scene = useOrbSceneContext();
  const [orbIndex, setOrbIndex] = useState(-1);

  // Register with scene on mount to get a monotonic index
  useEffect(() => {
    if (scene) {
      setOrbIndex(scene.registerOrb());
    }
  }, [scene]);

  // Scene context provides defaults; explicit props override
  const resolvedBreathing = scene?.breathing ?? 0;

  // Drift animation state
  const [animationProps, setAnimationProps] = useState<{
    animationName: string;
    duration: number;
    delay: number;
  } | null>(null);

  // Resolve drift config
  const driftEnabled = drift === true || (typeof drift === 'object' && drift !== null);
  const driftSpeed = typeof drift === 'object' ? (drift.speed ?? 1) : 1;

  const [px, py] = position;

  useEffect(() => {
    if (!driftEnabled || orbIndex < 0) {
      setAnimationProps(null);
      return;
    }

    const { keyframeCSS, animationName, duration, delay } = generateOrbAnimation(
      { color, position: [px, py], size },
      orbIndex,
      resolvedBreathing,
    );

    injectKeyframes(animationName, keyframeCSS);
    setAnimationProps({ animationName, duration: duration / driftSpeed, delay });

    return () => removeKeyframes(animationName);
  }, [driftEnabled, driftSpeed, orbIndex, resolvedBreathing, px, py, color, size]);

  // Build animation style
  const animationStyle = useMemo(() => {
    if (!animationProps) return {};
    return {
      animation: `${animationProps.animationName} ${animationProps.duration}s linear infinite`,
      animationDelay: `${animationProps.delay}s`,
    };
  }, [animationProps]);

  // TODO: Apply wavy SVG filter (plan 03)
  // TODO: Handle interactive hover effects (plan 04)

  return (
    <div
      className={className ? `orbkit-orb ${className}` : 'orbkit-orb'}
      style={{
        position: 'absolute',
        width: '130%',
        height: '130%',
        top: '-15%',
        left: '-15%',
        background: `radial-gradient(at ${px * 100}% ${py * 100}%, ${color} 0%, transparent ${size * 100}%)`,
        filter: `blur(${blur}px)`,
        mixBlendMode: blendMode,
        ...animationStyle,
        ...style,
      }}
    />
  );
}
