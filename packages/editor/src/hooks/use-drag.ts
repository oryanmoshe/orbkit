import { useCallback, useRef } from 'react';
import type { UseDragOptions } from '../types';

/**
 * Hook for drag interactions on the canvas preview.
 * Returns pointerdown handler — attach to drag handles.
 * Computes normalized [0-1] position relative to the container.
 */
export default function useDrag({ onDrag, containerRef }: UseDragOptions) {
  const draggingRef = useRef(false);

  const getPosition = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const el = containerRef.current;
      if (!el) return [0.5, 0.5];
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      return [x, y];
    },
    [containerRef],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = true;
      const target = e.target as HTMLElement;
      target.setPointerCapture(e.pointerId);
      const pointerId = e.pointerId;

      const onPointerMove = (ev: PointerEvent) => {
        if (!draggingRef.current) return;
        onDrag(getPosition(ev.clientX, ev.clientY));
      };

      const cleanup = () => {
        draggingRef.current = false;
        try {
          target.releasePointerCapture(pointerId);
        } catch {
          // Pointer capture may already be released
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', cleanup);
        window.removeEventListener('pointercancel', cleanup);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', cleanup);
      window.addEventListener('pointercancel', cleanup);
    },
    [onDrag, getPosition],
  );

  return { onPointerDown };
}
