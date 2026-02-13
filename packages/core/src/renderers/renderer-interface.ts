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

/** Common interface for all rendering backends */
export interface OrbRenderer {
  readonly type: RendererType;
  mount(container: HTMLElement): void;
  unmount(): void;
  setOrbs(orbs: OrbRenderConfig[]): void;
  setBackground(color: string): void;
  setGrain(intensity: number): void;
  resize(width: number, height: number): void;
  start(): void;
  stop(): void;
  destroy(): void;
}
