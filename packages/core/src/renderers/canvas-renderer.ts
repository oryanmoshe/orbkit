// TODO: Canvas 2D renderer
// Single <canvas>, each orb drawn as gaussian-blurred circle.
// Blending via canvas composite operations (globalCompositeOperation).
// Grain rendered on same canvas.

export interface CanvasRendererOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export function createCanvasRenderer(_options: CanvasRendererOptions): {
  render: () => void;
  destroy: () => void;
} {
  // TODO: Implement canvas rendering
  return {
    render: () => {},
    destroy: () => {},
  };
}
