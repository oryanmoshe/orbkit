import { type JSX, useEffect, useId, useMemo, useState } from 'react';
import { useOrbSceneContext } from '../context';
import { generateOrbAnimation } from '../renderers/css-renderer';
import type { OrbProps, WavyConfig } from '../types';
import { injectKeyframes, removeKeyframes } from '../utils/keyframe-registry';
import { WavyFilter } from './wavy-filter';

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
  wavy,
  drift,
  renderer: _renderer,
  interactive,
  className,
  style,
}: OrbProps): JSX.Element {
  const scene = useOrbSceneContext();
  const instanceId = useId();
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
    const safeDriftSpeed = driftSpeed > 0 ? driftSpeed : 1;
    setAnimationProps({ animationName, duration: duration / safeDriftSpeed, delay });

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

  // Resolve wavy config
  const wavyEnabled = wavy === true || (typeof wavy === 'object' && wavy !== null);
  const wavyConfig: WavyConfig = typeof wavy === 'object' && wavy !== null ? wavy : {};
  // useId() provides stable unique IDs that work in both SSR and client
  const wavyFilterId = wavyEnabled ? `orbkit-wavy-${instanceId.replace(/:/g, '')}` : '';

  // Build filter CSS — combine wavy SVG filter + blur
  const filterCSS = wavyEnabled ? `url(#${wavyFilterId}) blur(${blur}px)` : `blur(${blur}px)`;

  // Interactive parallax — CSS custom properties set by scene, offset computed via calc()
  const interactiveEnabled = interactive === true;
  const intensity = 35; // percentage offset at max displacement

  const interactiveStyle = interactiveEnabled
    ? {
        transform: `translate(calc((var(--orbkit-mx, 0.5) - ${px}) * ${intensity}%), calc((var(--orbkit-my, 0.5) - ${py}) * ${intensity}%))`,
        transition: 'transform 0.2s ease-out',
        willChange: 'transform' as const,
      }
    : {};

  // When both drift + interactive are active, use wrapper div to avoid transform conflicts
  const orbContent = (
    <>
      {wavyEnabled && (
        <WavyFilter
          filterId={wavyFilterId}
          config={wavyConfig}
          seed={orbIndex >= 0 ? orbIndex * 17 : 0}
        />
      )}
    </>
  );

  const orbStyle = {
    position: 'absolute' as const,
    width: '130%',
    height: '130%',
    top: '-15%',
    left: '-15%',
    background: `radial-gradient(at ${px * 100}% ${py * 100}%, ${color} 0%, transparent ${size * 100}%)`,
    filter: filterCSS,
    mixBlendMode: blendMode,
  };

  // Drift + interactive: outer div for drift animation, inner div carries visuals + parallax
  if (driftEnabled && interactiveEnabled) {
    return (
      <div
        className="orbkit-orb-drift"
        style={{
          position: 'absolute' as const,
          width: '130%',
          height: '130%',
          top: '-15%',
          left: '-15%',
          ...animationStyle,
        }}
      >
        <div
          className={className ? `orbkit-orb ${className}` : 'orbkit-orb'}
          style={{
            width: '100%',
            height: '100%',
            background: orbStyle.background,
            filter: orbStyle.filter,
            mixBlendMode: orbStyle.mixBlendMode,
            ...interactiveStyle,
            ...style,
          }}
        >
          {orbContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className={className ? `orbkit-orb ${className}` : 'orbkit-orb'}
      style={{
        ...orbStyle,
        ...animationStyle,
        ...interactiveStyle,
        ...style,
      }}
    >
      {orbContent}
    </div>
  );
}
