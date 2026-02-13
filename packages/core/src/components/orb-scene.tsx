import { type JSX, createElement } from 'react';
import { OrbSceneContext, useOrbSceneProvider } from '../context';
import { presets } from '../presets';
import type { OrbSceneProps } from '../types';
import { Grain } from './grain';
import { Orb } from './orb';

/**
 * OrbScene — Container and compositor for Orb components.
 *
 * Provides scene context (background, grain, breathing, renderer)
 * that child Orb components inherit from. When a `preset` is given,
 * auto-renders the preset's orbs with drift enabled. Auto-injects
 * a Grain overlay when grain > 0.
 */
export function OrbScene({
  background,
  grain,
  breathing,
  preset,
  renderer = 'css',
  className,
  style,
  as = 'div',
  children,
}: OrbSceneProps): JSX.Element {
  // Resolve preset
  const presetData = preset ? presets[preset] : null;

  const resolvedBackground = background ?? presetData?.backgroundColor ?? '#000000';
  const resolvedGrain = grain ?? (presetData ? presetData.grain / 100 : 0);
  const resolvedBreathing = breathing ?? presetData?.breathing ?? 0;
  const resolvedSaturation = presetData?.saturation ?? 70;

  const contextValue = useOrbSceneProvider({
    background: resolvedBackground,
    grain: resolvedGrain,
    breathing: resolvedBreathing,
    renderer,
    saturation: resolvedSaturation,
  });

  // Auto-generate orbs from preset
  const presetOrbs = presetData?.points.map((point, index) => (
    <Orb
      key={point.id}
      color={point.color}
      position={point.position}
      size={point.radius}
      blur={40 + index * 10}
      drift
    />
  ));

  return (
    <OrbSceneContext.Provider value={contextValue}>
      {createElement(
        as,
        {
          className: className ? `orbkit-scene ${className}` : 'orbkit-scene',
          style: {
            position: 'relative' as const,
            overflow: 'hidden',
            backgroundColor: resolvedBackground,
            ...style,
          },
        },
        presetOrbs,
        children,
        resolvedGrain > 0 ? <Grain intensity={resolvedGrain} /> : null,
      )}
    </OrbSceneContext.Provider>
  );
}
