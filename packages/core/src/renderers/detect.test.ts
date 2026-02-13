import { beforeEach, describe, expect, it } from 'bun:test';
import { _resetDetectionCache, detectBestRenderer } from './detect';

describe('detectBestRenderer', () => {
  beforeEach(() => {
    _resetDetectionCache();
  });

  it('returns css in SSR (no document)', () => {
    // Bun test env has no document by default
    expect(detectBestRenderer()).toBe('css');
  });

  it('returns a valid RendererType', () => {
    const result = detectBestRenderer();
    expect(['css', 'canvas', 'webgl']).toContain(result);
  });
});
