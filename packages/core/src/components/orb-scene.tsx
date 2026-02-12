import { type JSX, createElement } from 'react';
import type { OrbSceneProps } from '../types';

/**
 * OrbScene — Container and compositor for Orb components.
 *
 * Provides the scene context (background, grain, breathing, renderer)
 * that child Orb components inherit from.
 */
export function OrbScene({
  background,
  grain: _grain,
  breathing: _breathing,
  preset: _preset,
  renderer: _renderer,
  className,
  style,
  as = 'div',
  children,
}: OrbSceneProps): JSX.Element {
  // TODO: Resolve preset to scene config
  // TODO: Create scene context for child orbs
  // TODO: Inject grain overlay when grain > 0
  // TODO: Handle renderer selection

  return createElement(
    as,
    {
      className: className ? `orbkit-scene ${className}` : 'orbkit-scene',
      style: {
        position: 'relative' as const,
        overflow: 'hidden',
        backgroundColor: background,
        ...style,
      },
    },
    children,
  );
}
