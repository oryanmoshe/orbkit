import type { Point } from 'orbkit';
import { useCallback, useRef } from 'react';

interface UseDragOptions {
  onDrag: (position: Point) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Hook for drag interactions on the canvas preview.
 * Returns pointerdown handler — attach to drag handles.
 * Computes normalized [0-1] position relative to the container.
 */
export default function useDrag({ onDrag, containerRef }: UseDragOptions) {
  const draggingRef = useRef(false);

  const getPosition = useCallback(
    (clientX: number, clientY: number): Point => {
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
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const onPointerMove = (ev: PointerEvent) => {
        if (!draggingRef.current) return;
        onDrag(getPosition(ev.clientX, ev.clientY));
      };

      const onPointerUp = () => {
        draggingRef.current = false;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [onDrag, getPosition],
  );

  return { onPointerDown };
}
