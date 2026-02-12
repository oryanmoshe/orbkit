import type { JSX } from 'react';
import type { OrbProps } from '../types';

/**
 * Orb — An individual animated orb primitive.
 *
 * Can be used inside an OrbScene for composed backgrounds,
 * or standalone for individual orb effects.
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
  // TODO: Resolve renderer from context or props
  // TODO: Apply drift animation
  // TODO: Apply wavy SVG filter
  // TODO: Handle interactive hover effects

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
