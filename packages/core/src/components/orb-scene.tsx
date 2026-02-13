import type React from 'react';
import { type JSX, createElement, useEffect, useRef } from 'react';
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
 * a Grain overlay when grain > 0. Tracks pointer position for
 * interactive orbs via CSS custom properties.
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

  const containerRef = useRef<HTMLElement | null>(null);

  const contextValue = useOrbSceneProvider({
    background: resolvedBackground,
    grain: resolvedGrain,
    breathing: resolvedBreathing,
    renderer,
    saturation: resolvedSaturation,
    containerRef,
  });

  // Scene-level pointer tracking — sets CSS custom properties for interactive orbs
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width;
        const my = (e.clientY - rect.top) / rect.height;
        container.style.setProperty('--orbkit-mx', String(mx));
        container.style.setProperty('--orbkit-my', String(my));
        rafId = null;
      });
    };

    const handlePointerLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      container.style.setProperty('--orbkit-mx', '0.5');
      container.style.setProperty('--orbkit-my', '0.5');
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

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

  // Callback ref to assign containerRef from createElement
  const setRef = (el: HTMLElement | null) => {
    containerRef.current = el;
  };

  return (
    <OrbSceneContext.Provider value={contextValue}>
      {createElement(
        as,
        {
          ref: setRef,
          className: className ? `orbkit-scene ${className}` : 'orbkit-scene',
          style: {
            position: 'relative' as const,
            overflow: 'hidden',
            backgroundColor: resolvedBackground,
            '--orbkit-mx': '0.5',
            '--orbkit-my': '0.5',
            ...style,
          } as React.CSSProperties,
        },
        presetOrbs,
        children,
        resolvedGrain > 0 ? <Grain intensity={resolvedGrain} /> : null,
      )}
    </OrbSceneContext.Provider>
  );
}
