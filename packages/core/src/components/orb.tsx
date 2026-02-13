import { type JSX, useEffect, useId, useMemo, useState } from 'react';
import { useOrbSceneContext } from '../context';
import { generateOrbAnimation } from '../renderers/css-renderer';
import type { OrbProps, OrbRenderConfig, WavyConfig } from '../types';
import { injectKeyframes, removeKeyframes } from '../utils/keyframe-registry';
import { WavyFilter } from './wavy-filter';

/**
 * Orb — An individual animated orb primitive.
 *
 * Can be used inside an OrbScene for composed backgrounds,
 * or standalone for individual orb effects. When inside an
 * OrbScene, inherits breathing/renderer from context.
 *
 * For CSS rendering: renders a `<div>` with radial-gradient, blur, and blend mode.
 * For Canvas/WebGL rendering: registers config with the scene and renders nothing
 * (the imperative renderer draws all orbs on a shared canvas).
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
}: OrbProps): JSX.Element | null {
  const scene = useOrbSceneContext();
  const instanceId = useId();
  const [orbIndex, setOrbIndex] = useState(-1);

  const resolvedRenderer = scene?.renderer ?? 'css';
  const isImperative = resolvedRenderer !== 'css';

  const [px, py] = position;
  const driftEnabled = drift === true || (typeof drift === 'object' && drift !== null);
  const driftSpeed = typeof drift === 'object' ? (drift.speed ?? 1) : 1;
  const resolvedBreathing = scene?.breathing ?? 0;

  // Register with scene on mount to get a monotonic index
  useEffect(() => {
    if (scene) {
      setOrbIndex(scene.registerOrb());
    }
  }, [scene]);

  // ─── Imperative renderer: register/update/unregister orb config ──────────

  useEffect(() => {
    if (!isImperative || !scene) return;

    const config: OrbRenderConfig = {
      id: instanceId,
      color,
      position: [px, py],
      size,
      blur,
      blendMode,
      drift: drift ?? false,
      wavy: wavy ?? false,
    };

    scene.registerOrbConfig(instanceId, config);
    return () => scene.unregisterOrbConfig(instanceId);
  }, [isImperative, scene, instanceId, color, px, py, size, blur, blendMode, drift, wavy]);

  // ─── CSS renderer: drift animation ───────────────────────────────────────

  const [animationProps, setAnimationProps] = useState<{
    animationName: string;
    duration: number;
    delay: number;
  } | null>(null);

  useEffect(() => {
    if (isImperative || !driftEnabled || orbIndex < 0) {
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
  }, [isImperative, driftEnabled, driftSpeed, orbIndex, resolvedBreathing, px, py, color, size]);

  const animationStyle = useMemo(() => {
    if (!animationProps) return {};
    return {
      animation: `${animationProps.animationName} ${animationProps.duration}s linear infinite`,
      animationDelay: `${animationProps.delay}s`,
    };
  }, [animationProps]);

  // ─── CSS renderer: wavy filter ───────────────────────────────────────────

  const wavyEnabled = wavy === true || (typeof wavy === 'object' && wavy !== null);
  const wavyConfig: WavyConfig = typeof wavy === 'object' && wavy !== null ? wavy : {};
  const wavyFilterId = wavyEnabled ? `orbkit-wavy-${instanceId.replace(/:/g, '')}` : '';
  const filterCSS = wavyEnabled ? `url(#${wavyFilterId}) blur(${blur}px)` : `blur(${blur}px)`;

  // ─── CSS renderer: interactive parallax ──────────────────────────────────

  const interactiveEnabled = interactive === true;
  const intensity = 35;

  const interactiveStyle = interactiveEnabled
    ? {
        transform: `translate(calc((var(--orbkit-mx, 0.5) - ${px}) * ${intensity}%), calc((var(--orbkit-my, 0.5) - ${py}) * ${intensity}%))`,
        transition: 'transform 0.2s ease-out',
        willChange: 'transform' as const,
      }
    : {};

  // ─── Render ──────────────────────────────────────────────────────────────

  // Imperative renderers: render nothing (orb data is in the renderer)
  if (isImperative) {
    return null;
  }

  // CSS renderer: render <div> with gradient, animation, blur
  const orbContent = wavyEnabled ? (
    <WavyFilter
      filterId={wavyFilterId}
      config={wavyConfig}
      seed={orbIndex >= 0 ? orbIndex * 17 : 0}
    />
  ) : null;

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
