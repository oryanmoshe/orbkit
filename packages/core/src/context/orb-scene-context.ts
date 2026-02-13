import { type RefObject, createContext, useCallback, useContext, useMemo, useRef } from 'react';
import type { OrbRenderConfig, OrbRenderer, OrbSceneContextValue, RendererType } from '../types';

const OrbSceneContext = createContext<OrbSceneContextValue | null>(null);
OrbSceneContext.displayName = 'OrbSceneContext';

export { OrbSceneContext };

/**
 * Read scene context values. Returns null when used outside an OrbScene
 * (standalone orb usage is valid — callers should handle null).
 */
export function useOrbSceneContext(): OrbSceneContextValue | null {
  return useContext(OrbSceneContext);
}

/**
 * Hook used inside OrbScene to create the context value with a stable
 * monotonic orb index counter and orb config registration for imperative renderers.
 */
export function useOrbSceneProvider({
  background,
  grain,
  breathing,
  renderer,
  saturation,
  containerRef,
}: {
  background: string;
  grain: number;
  breathing: number;
  renderer: RendererType;
  saturation: number;
  containerRef: RefObject<HTMLElement | null>;
}): OrbSceneContextValue {
  const nextOrbIndexRef = useRef(0);
  const orbConfigsRef = useRef(new Map<string, OrbRenderConfig>());
  const imperativeRendererRef = useRef<OrbRenderer | null>(null);

  const registerOrb = useCallback(() => {
    const index = nextOrbIndexRef.current;
    nextOrbIndexRef.current += 1;
    return index;
  }, []);

  /** Sync the current orb configs map to the imperative renderer */
  const syncToRenderer = useCallback(() => {
    const renderer = imperativeRendererRef.current;
    if (renderer) {
      renderer.setOrbs(Array.from(orbConfigsRef.current.values()));
    }
  }, []);

  const registerOrbConfig = useCallback(
    (id: string, config: OrbRenderConfig) => {
      orbConfigsRef.current.set(id, config);
      syncToRenderer();
    },
    [syncToRenderer],
  );

  const unregisterOrbConfig = useCallback(
    (id: string) => {
      orbConfigsRef.current.delete(id);
      syncToRenderer();
    },
    [syncToRenderer],
  );

  return useMemo(
    () => ({
      background,
      grain,
      breathing,
      renderer,
      saturation,
      containerRef,
      registerOrb,
      registerOrbConfig,
      unregisterOrbConfig,
      imperativeRendererRef,
      orbConfigsRef,
    }),
    [
      background,
      grain,
      breathing,
      renderer,
      saturation,
      containerRef,
      registerOrb,
      registerOrbConfig,
      unregisterOrbConfig,
    ],
  );
}
