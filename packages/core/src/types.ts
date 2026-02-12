import type { CSSProperties, ReactNode } from 'react';

/** Normalized 2D point [x, y] where both values are 0-1 */
export type Point = [x: number, y: number];

/** Supported blend modes for orbs */
export type BlendMode =
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'multiply'
  | 'color-dodge'
  | 'lighten'
  | 'hard-light'
  | 'normal';

/** Supported rendering backends */
export type RendererType = 'css' | 'canvas' | 'webgl';

/** Configuration for wavy/organic edge animation */
export interface WavyConfig {
  /** Noise scale factor (default: 1) */
  scale?: number;
  /** Animation speed multiplier (default: 1) */
  speed?: number;
  /** Distortion intensity (default: 1) */
  intensity?: number;
}

/** Configuration for drift/orbit animation */
export interface DriftConfig {
  /** Animation speed multiplier (default: 1) */
  speed?: number;
  /** Orbit amplitude 0-1 (default: auto from position) */
  amplitude?: number;
  /** Drift direction in degrees (default: auto) */
  direction?: number;
}

/** Props for the Orb component */
export interface OrbProps {
  /** Hex color string */
  color: string;
  /** Normalized [x, y] position, 0-1 */
  position?: Point;
  /** Orb spread radius — 0-1 normalized or px value */
  size?: number;
  /** Per-orb blur in px — applied as CSS filter: blur() */
  blur?: number;
  /** CSS mix-blend-mode (default: 'screen') */
  blendMode?: BlendMode;
  /** Organic edge animation. true for defaults, or WavyConfig */
  wavy?: boolean | WavyConfig;
  /** Orbit/drift animation. true for defaults, or DriftConfig. false to disable */
  drift?: boolean | DriftConfig;
  /** Per-orb renderer override */
  renderer?: RendererType;
  /** Enable mouse hover effects */
  interactive?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

/** Polymorphic element type for OrbScene */
export type OrbSceneElement = 'div' | 'section' | 'main' | 'aside' | 'article' | 'header';

/** Props for the OrbScene container component */
export interface OrbSceneProps {
  /** Background color */
  background?: string;
  /** Noise overlay intensity 0-1 */
  grain?: number;
  /** Global animation intensity 0-100 */
  breathing?: number;
  /** Named preset to use */
  preset?: string;
  /** Default renderer for all children */
  renderer?: RendererType;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Render as a different HTML element (default: 'div') */
  as?: OrbSceneElement;
  /** Child Orb components or other content */
  children?: ReactNode;
}

/** Props for the Grain noise overlay */
export interface GrainProps {
  /** Noise intensity 0-1 */
  intensity?: number;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

/** A single point in a preset theme */
export interface PresetPoint {
  id: string;
  color: string;
  position: Point;
  radius: number;
}

/** A preset theme configuration */
export interface Preset {
  name: string;
  label: string;
  backgroundColor: string;
  points: PresetPoint[];
  saturation: number;
  grain: number;
  breathing: number;
}

/** HSL color representation */
export interface HslColor {
  h: number;
  s: number;
  l: number;
}

/** Orbit parameters for drift animation */
export interface OrbitParams {
  amplitudeX: number;
  amplitudeY: number;
  duration: number;
  delay: number;
}
