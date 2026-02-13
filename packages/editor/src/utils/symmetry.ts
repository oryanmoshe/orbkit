import type { Point } from 'orbkit';

const CENTER: Point = [0.5, 0.5];

/**
 * Compute symmetrical positions for all orbs around center (0.5, 0.5).
 * When one orb is dragged, all others maintain equal angular spacing
 * at the same radius from center.
 */
export function computeSymmetricalPositions(
  movedPosition: Point,
  orbCount: number,
  movedIndex: number,
): Point[] {
  if (orbCount <= 0) return [];
  if (orbCount === 1) return [movedPosition];

  const dx = movedPosition[0] - CENTER[0];
  const dy = movedPosition[1] - CENTER[1];
  const radius = Math.sqrt(dx * dx + dy * dy);
  const baseAngle = Math.atan2(dy, dx);

  // The moved orb is at movedIndex, so its angle offset is movedIndex * step
  const step = (2 * Math.PI) / orbCount;
  // Base angle for orb 0: baseAngle - movedIndex * step
  const angle0 = baseAngle - movedIndex * step;

  return Array.from({ length: orbCount }, (_, i) => {
    const angle = angle0 + i * step;
    const x = Math.max(0, Math.min(1, CENTER[0] + radius * Math.cos(angle)));
    const y = Math.max(0, Math.min(1, CENTER[1] + radius * Math.sin(angle)));
    return [x, y] as Point;
  });
}
