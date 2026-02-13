/** Deterministic pseudo-random number from a seed */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Generate a random border-radius string like "60% 40% 30% 70% / 50% 60% 30% 60%" */
function randomBorderRadius(rand: () => number): string {
  const r = () => Math.round(30 + rand() * 40); // 30-70%
  return `${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%`;
}

/**
 * Generate CSS @keyframes for a blob morph animation.
 * Each orb gets a unique, deterministic morph based on its seed.
 * Returns the animation name and CSS keyframe text.
 */
export function generateBlobMorphKeyframes(
  seed: number,
  speed: number,
): { animationName: string; keyframeCSS: string; duration: number } {
  const rand = seededRandom(seed + 1);
  const name = `orbkit-blob-${seed}`;
  const safeSpeed = speed > 0 ? speed : 1;
  const duration = 8 / safeSpeed;

  const keyframeCSS = `@keyframes ${name} {
  0%, 100% { border-radius: ${randomBorderRadius(rand)}; }
  25% { border-radius: ${randomBorderRadius(rand)}; }
  50% { border-radius: ${randomBorderRadius(rand)}; }
  75% { border-radius: ${randomBorderRadius(rand)}; }
}`;

  return { animationName: name, keyframeCSS, duration };
}
