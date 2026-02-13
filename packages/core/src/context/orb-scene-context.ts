import { type RefObject, createContext, useCallback, useContext, useRef } from 'react';
import type { OrbSceneContextValue, RendererType } from '../types';

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
 * monotonic orb index counter.
 */
export function useOrbSceneProvider(values: {
  background: string;
  grain: number;
  breathing: number;
  renderer: RendererType;
  saturation: number;
  containerRef: RefObject<HTMLElement | null>;
}): OrbSceneContextValue {
  const nextOrbIndexRef = useRef(0);

  const registerOrb = useCallback(() => {
    const index = nextOrbIndexRef.current;
    nextOrbIndexRef.current += 1;
    return index;
  }, []);

  return {
    ...values,
    registerOrb,
  };
}
