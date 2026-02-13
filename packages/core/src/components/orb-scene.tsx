import { type JSX, createElement } from 'react';
import { OrbSceneContext, useOrbSceneProvider } from '../context';
import type { OrbSceneProps } from '../types';
import { Grain } from './grain';

/**
 * OrbScene — Container and compositor for Orb components.
 *
 * Provides scene context (background, grain, breathing, renderer)
 * that child Orb components inherit from. Auto-injects a Grain
 * overlay when grain > 0.
 */
export function OrbScene({
  background = '#000000',
  grain = 0,
  breathing = 0,
  preset: _preset,
  renderer = 'css',
  className,
  style,
  as = 'div',
  children,
}: OrbSceneProps): JSX.Element {
  // TODO: Resolve preset to scene config (plan 05)

  const contextValue = useOrbSceneProvider({
    background,
    grain,
    breathing,
    renderer,
    saturation: 70, // TODO: derive from preset (plan 05)
  });

  return (
    <OrbSceneContext.Provider value={contextValue}>
      {createElement(
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
        grain > 0 ? <Grain intensity={grain} /> : null,
      )}
    </OrbSceneContext.Provider>
  );
}
