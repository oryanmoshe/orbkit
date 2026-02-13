import type { BlendMode, DriftConfig, Point, RendererType, WavyConfig } from '../types';

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
  /** Resize the rendering surface to new dimensions */
  resize(width: number, height: number): void;
  /** Start the render loop */
  start(): void;
  /** Stop the render loop */
  stop(): void;
  /** Stop rendering, unmount, and release all resources */
  destroy(): void;
}
