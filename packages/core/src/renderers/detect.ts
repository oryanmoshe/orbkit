import type { RendererType } from '../types';

/** Cached auto-detection result (not cached during SSR — module may later run in browser) */
let cachedRenderer: RendererType | null = null;

/**
 * Detect the best available renderer for the current environment.
 *
 * Returns CSS by default — it is the most feature-complete renderer,
 * supporting blur, wavy edges (SVG filters), interactive parallax,
 * and smooth gradient blending. Canvas and WebGL renderers are available
 * for high-orb-count scenes where DOM-based rendering becomes a bottleneck,
 * but must be explicitly opted into via `renderer="canvas"` or `renderer="webgl"`.
 *
 * The detection still validates that CSS is viable (i.e., we're in a browser),
 * falling back gracefully in edge cases.
 */
export function detectBestRenderer(): RendererType {
  if (cachedRenderer) return cachedRenderer;

  if (typeof document === 'undefined') {
    // SSR — don't cache, always return CSS
    return 'css';
  }

  // CSS is the most feature-complete renderer (blur, wavy, interactive parallax, grain overlay).
  // Canvas/WebGL are opt-in for performance-critical scenes with many orbs.
  cachedRenderer = 'css';
  return cachedRenderer;
}
