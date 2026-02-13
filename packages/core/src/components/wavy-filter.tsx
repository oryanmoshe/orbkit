import type { JSX } from 'react';
import type { WavyConfig } from '../types';

interface WavyFilterProps {
  /** Unique filter ID for this orb */
  filterId: string;
  /** Wavy configuration */
  config: WavyConfig;
  /** Seed for deterministic noise variation */
  seed: number;
}

/**
 * WavyFilter — Inline SVG filter that applies organic edge distortion to an orb.
 *
 * Uses feTurbulence (Perlin noise) + feDisplacementMap to warp the orb's edges.
 * Animation is handled via SVG <animate> — declarative, no JS, GPU-accelerated.
 */
export function WavyFilter({ filterId, config, seed }: WavyFilterProps): JSX.Element {
  const scale = config.scale ?? 30;
  const speed = config.speed ?? 1;
  const octaves = Math.min(Math.max(Math.round(config.intensity ?? 3), 1), 6);

  const baseFrequency = 0.01 + scale * 0.0005;
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
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
