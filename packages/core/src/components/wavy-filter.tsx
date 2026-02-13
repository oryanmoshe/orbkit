import type { JSX } from 'react';
import type { WavyConfig } from '../types';

interface WavyFilterProps {
  /** Unique filter ID for this orb */
  filterId: string;
  /** Wavy configuration */
  config: WavyConfig;
  /** Seed for deterministic noise variation */
  seed: number;
  /** Blur value in px — displacement scales up to remain visible through blur */
  blur?: number;
}

/**
 * WavyFilter — Inline SVG filter that applies organic edge distortion to an orb.
 *
 * Uses feTurbulence (Perlin noise) + feDisplacementMap to warp the orb's edges.
 * The displacement scale increases with blur so wavy edges remain visible even
 * when heavy blur is applied. Animation is via SVG <animate> — no JS, GPU-accelerated.
 */
export function WavyFilter({ filterId, config, seed, blur = 0 }: WavyFilterProps): JSX.Element {
  const userScale = config.scale ?? 30;
  const speed = config.speed ?? 1;
  const octaves = Math.min(Math.max(Math.round(config.intensity ?? 2), 1), 6);

  // Frequency based on user scale — lower = smoother, more bubble-like undulations
  const baseFrequency = 0.008 + userScale * 0.0003;
  // Displacement increases with blur so wavy edges survive the smoothing
  const displacementScale = userScale + Math.max(0, blur) * 2;
  const safeSpeed = speed > 0 ? speed : 1;
  const duration = 8 / safeSpeed;

  return (
    <svg
      style={{ position: 'absolute', width: 0, height: 0 }}
      aria-hidden="true"
      className="orbkit-wavy-svg"
    >
      <defs>
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFrequency}
            numOctaves={octaves}
            seed={seed}
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              values={`${baseFrequency};${baseFrequency * 1.5};${baseFrequency}`}
              dur={`${duration}s`}
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={displacementScale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
