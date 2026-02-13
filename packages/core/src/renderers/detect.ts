import type { RendererType } from '../types';

/** Cached auto-detection result (not cached during SSR — module may later run in browser) */
let cachedRenderer: RendererType | null = null;

/**
 * Detect the best available renderer for the current environment.
 * Probes WebGL > Canvas > CSS, caching the result after the first browser call.
 */
export function detectBestRenderer(): RendererType {
  if (cachedRenderer) return cachedRenderer;

  if (typeof document === 'undefined') {
    // SSR — don't cache, always return CSS
    return 'css';
  }

  const testCanvas = document.createElement('canvas');

  // Try WebGL2/WebGL1
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (gl) {
    cachedRenderer = 'webgl';
    return cachedRenderer;
  }

  // Try Canvas 2D
  const ctx = testCanvas.getContext('2d');
  if (ctx) {
    cachedRenderer = 'canvas';
    return cachedRenderer;
  }

  // Fallback
  cachedRenderer = 'css';
  return cachedRenderer;
}
