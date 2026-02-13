import { type JSX, useEffect, useRef } from 'react';
import { useOrbSceneContext } from '../context';
import { createCanvasRenderer } from '../renderers/canvas-renderer';
import { createWebGLRenderer } from '../renderers/webgl-renderer';
import type { OrbRenderer } from '../types';

/**
 * ImperativeScene — Bridges React props to Canvas/WebGL imperative renderers.
 *
 * Rendered inside OrbScene when the renderer is 'canvas' or 'webgl'.
 * Creates the renderer instance, mounts it into its container div,
 * and syncs scene-level props (background, grain) via effects.
 * Orb configs are synced via the context registration callbacks.
 *
 * @internal Not exported from the public API.
 */
export function ImperativeScene({
  rendererType,
}: {
  rendererType: 'canvas' | 'webgl';
}): JSX.Element {
  const scene = useOrbSceneContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<OrbRenderer | null>(null);

  // Mount/unmount the imperative renderer
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !scene) return;

    const factory = rendererType === 'webgl' ? createWebGLRenderer : createCanvasRenderer;
    const renderer = factory();
    renderer.mount(container);
    renderer.setBackground(scene.background);
    renderer.setGrain(scene.grain);
    renderer.start();

    rendererRef.current = renderer;
    scene.imperativeRendererRef.current = renderer;

    // Initial sync of any orb configs that registered before this effect ran
    const configs = Array.from(scene.orbConfigsRef.current.values());
    if (configs.length > 0) {
      renderer.setOrbs(configs);
    }

    return () => {
      scene.imperativeRendererRef.current = null;
      rendererRef.current = null;
      renderer.destroy();
    };
  }, [rendererType, scene]);

  // Sync background color
  useEffect(() => {
    rendererRef.current?.setBackground(scene?.background ?? '#000000');
  }, [scene?.background]);

  // Sync grain intensity
  useEffect(() => {
    rendererRef.current?.setGrain(scene?.grain ?? 0);
  }, [scene?.grain]);

  // Handle container resize via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        rendererRef.current?.resize(entry.contentRect.width, entry.contentRect.height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
