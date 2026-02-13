import type { CSSProperties, MutableRefObject, ReactNode, RefObject } from 'react';

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
  /** Renderer: 'css' (default), 'canvas', 'webgl', or 'auto' (detect best) */
  renderer?: RendererType | 'auto';
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

/** Scene-level values provided to child Orb components via context */
export interface OrbSceneContextValue {
  background: string;
  grain: number;
  breathing: number;
  renderer: RendererType;
  saturation: number;
  /** Register an orb and receive a unique monotonic index for animation staggering */
  registerOrb: () => number;
  /** Ref to the scene container element for pointer tracking */
  containerRef: RefObject<HTMLElement | null>;
  /** @internal Register an orb config for imperative (Canvas/WebGL) rendering */
  registerOrbConfig: (id: string, config: OrbRenderConfig) => void;
  /** @internal Unregister an orb config when it unmounts */
  unregisterOrbConfig: (id: string) => void;
  /** @internal Ref to the imperative renderer instance (set by ImperativeScene) */
  imperativeRendererRef: MutableRefObject<OrbRenderer | null>;
  /** @internal Ref to the map of registered orb configs */
  orbConfigsRef: MutableRefObject<Map<string, OrbRenderConfig>>;
}

/** Orbit parameters for drift animation */
export interface OrbitParams {
  amplitudeX: number;
  amplitudeY: number;
  duration: number;
  delay: number;
}

/** Configuration for a single orb passed to a renderer */
export interface OrbRenderConfig {
  id: string;
  color: string;
  position: Point;
  size: number;
  blur: number;
  blendMode: BlendMode;
  drift: boolean | DriftConfig;
  wavy: boolean | WavyConfig;
  interactive: boolean;
}

/** Common interface for all rendering backends (CSS, Canvas, WebGL) */
export interface OrbRenderer {
  /** Renderer type identifier */
  readonly type: RendererType;
  /** Create and attach the rendering surface to a container element */
  mount(container: HTMLElement): void;
  /** Remove the rendering surface from the DOM */
  unmount(): void;
  /** Update the set of orbs to render */
  setOrbs(orbs: OrbRenderConfig[]): void;
  /** Set the scene background color */
  setBackground(color: string): void;
  /** Set the grain noise overlay intensity (0-1) */
  setGrain(intensity: number): void;
  /** Update pointer position for interactive parallax (normalized 0-1) */
  setPointerPosition(x: number, y: number): void;
  /** Resize the rendering surface to new dimensions */
  resize(width: number, height: number): void;
  /** Start the render loop */
  start(): void;
  /** Stop the render loop */
  stop(): void;
  /** Stop rendering, unmount, and release all resources */
  destroy(): void;
}
