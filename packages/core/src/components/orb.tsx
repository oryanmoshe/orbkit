import { type JSX, useEffect, useState } from 'react';
import { useOrbSceneContext } from '../context';
import type { OrbProps } from '../types';

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
  drift: _drift,
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
  const _resolvedRenderer = _renderer ?? scene?.renderer ?? 'css';
  const _resolvedBreathing = scene?.breathing ?? 0;

  // orbIndex available for future animation staggering (plan 02)
  void orbIndex;
  void _resolvedRenderer;
  void _resolvedBreathing;

  // TODO: Apply drift animation (plan 02)
  // TODO: Apply wavy SVG filter (plan 03)
  // TODO: Handle interactive hover effects (plan 04)

  const [x, y] = position;

  return (
    <div
      className={className ? `orbkit-orb ${className}` : 'orbkit-orb'}
      style={{
        position: 'absolute',
        width: '130%',
        height: '130%',
        top: '-15%',
        left: '-15%',
        background: `radial-gradient(at ${x * 100}% ${y * 100}%, ${color} 0%, transparent ${size * 100}%)`,
        filter: `blur(${blur}px)`,
        mixBlendMode: blendMode,
        ...style,
      }}
    />
  );
}
