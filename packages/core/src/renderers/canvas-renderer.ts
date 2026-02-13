import type { BlendMode, OrbRenderConfig, OrbRenderer, OrbitParams } from '../types';
import { calculateDriftOffset, getOrbitParams } from '../utils/animation';
import { hexToRgba } from '../utils/color';

/** Blend mode mapping: CSS mix-blend-mode → Canvas globalCompositeOperation */
export const BLEND_MODE_MAP: Record<BlendMode, GlobalCompositeOperation> = {
  screen: 'screen',
  multiply: 'multiply',
  overlay: 'overlay',
  'hard-light': 'hard-light',
  'soft-light': 'soft-light',
  'color-dodge': 'color-dodge',
  lighten: 'lighten',
  normal: 'source-over',
};

/** Shared zero offset to avoid per-frame allocation for non-drift orbs */
const ZERO_OFFSET: Readonly<{ x: number; y: number }> = { x: 0, y: 0 };

/** Internal orb with pre-computed values for rendering */
interface InternalOrb extends OrbRenderConfig {
  rgbaColor: string;
  rgbaColorTransparent: string;
  orbitParams: OrbitParams;
}

/** Pre-compute rgba colors and orbit params for each orb config */
function toInternalOrbs(configs: OrbRenderConfig[]): InternalOrb[] {
  return configs.map((config, index) => ({
    ...config,
    rgbaColor: hexToRgba(config.color),
    rgbaColorTransparent: hexToRgba(config.color, 0),
    orbitParams: getOrbitParams(config.position[0], config.position[1], index, 50),
  }));
}

/** Create a Canvas 2D renderer implementing the OrbRenderer interface */
export function createCanvasRenderer(): OrbRenderer {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationId: number | null = null;
  let orbs: InternalOrb[] = [];
  let background = '#000000';
  let grainIntensity = 0;
  let cachedGrainCanvas: HTMLCanvasElement | null = null;
  let running = false;
  let pointerX = 0.5;
  let pointerY = 0.5;

  function render(time: number) {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);

    // Orbs
    const dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;
    for (const orb of orbs) {
      ctx.globalCompositeOperation = BLEND_MODE_MAP[orb.blendMode] ?? 'source-over';
      ctx.save();

      // Drift offset
      const driftEnabled =
        orb.drift === true || (typeof orb.drift === 'object' && orb.drift !== null);
      const offset = driftEnabled ? calculateDriftOffset(orb.orbitParams, time) : ZERO_OFFSET;

      // Interactive parallax offset
      const interactiveIntensity = 0.35;
      const ix = orb.interactive ? (pointerX - orb.position[0]) * interactiveIntensity : 0;
      const iy = orb.interactive ? (pointerY - orb.position[1]) * interactiveIntensity : 0;

      const cx = (orb.position[0] + offset.x + ix) * w;
      const cy = (orb.position[1] + offset.y + iy) * h;
      const radius = orb.size * Math.max(w, h) * 0.65;

      // Gaussian blur — matches CSS filter: blur() for smooth orb edges & merging
      const blurPx = orb.blur * dpr;
      if (blurPx > 0) {
        ctx.filter = `blur(${blurPx}px)`;
      }

      // Radial gradient — soft falloff so blur has material to spread
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, orb.rgbaColor);
      gradient.addColorStop(0.5, orb.rgbaColor);
      gradient.addColorStop(0.85, orb.rgbaColorTransparent);
      gradient.addColorStop(1, 'transparent');

      // Fill a padded rect (not arc) so blur can spread beyond the gradient edge
      const pad = blurPx * 3;
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - radius - pad, cy - radius - pad, (radius + pad) * 2, (radius + pad) * 2);

      ctx.filter = 'none';
      ctx.restore();
    }

    // Grain overlay — uses drawImage so globalCompositeOperation is respected
    if (grainIntensity > 0) {
      renderGrain(w, h);
    }

    if (running) {
      animationId = requestAnimationFrame(render);
    }
  }

  function renderGrain(w: number, h: number) {
    if (!ctx) return;

    // Generate and cache grain on an offscreen canvas at current resolution
    if (!cachedGrainCanvas || cachedGrainCanvas.width !== w || cachedGrainCanvas.height !== h) {
      cachedGrainCanvas = generateGrainCanvas(w, h, grainIntensity);
    }

    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(cachedGrainCanvas, 0, 0);
  }

  return {
    type: 'canvas' as const,

    mount(container: HTMLElement) {
      if (typeof document === 'undefined') return;
      canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      ctx = canvas.getContext('2d');
      container.appendChild(canvas);

      // Initial size from container
      const rect = container.getBoundingClientRect();
      const dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    },

    unmount() {
      this.stop();
      if (canvas?.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
    },

    setOrbs(configs: OrbRenderConfig[]) {
      orbs = toInternalOrbs(configs);
    },

    setBackground(color: string) {
      background = color;
    },

    setGrain(intensity: number) {
      grainIntensity = intensity;
      cachedGrainCanvas = null; // invalidate cache when intensity changes
    },

    setPointerPosition(x: number, y: number) {
      pointerX = x;
      pointerY = y;
    },

    resize(width: number, height: number) {
      if (!canvas) return;
      const dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      cachedGrainCanvas = null; // invalidate grain cache on resize
    },

    start() {
      if (running) return; // idempotent — prevent parallel rAF loops
      running = true;
      if (typeof requestAnimationFrame !== 'undefined') {
        animationId = requestAnimationFrame(render);
      }
    },

    stop() {
      running = false;
      if (animationId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },

    destroy() {
      this.stop();
      this.unmount();
      canvas = null;
      ctx = null;
      orbs = [];
      cachedGrainCanvas = null;
    },
  };
}

/**
 * Generate a grain noise pattern on an offscreen canvas.
 * Using an offscreen canvas (instead of ImageData + putImageData) allows
 * the grain to be composited via drawImage, which respects globalCompositeOperation.
 */
function generateGrainCanvas(w: number, h: number, intensity: number): HTMLCanvasElement {
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return offscreen;

  const imageData = offCtx.createImageData(w, h);
  const data = imageData.data;
  const alpha = Math.round(intensity * 128);

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.random() * 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = alpha;
  }

  offCtx.putImageData(imageData, 0, 0);
  return offscreen;
}
