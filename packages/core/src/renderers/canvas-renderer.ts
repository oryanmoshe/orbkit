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

  function render(time: number) {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);

    // Orbs
    for (const orb of orbs) {
      ctx.globalCompositeOperation = BLEND_MODE_MAP[orb.blendMode] ?? 'source-over';
      ctx.save();

      // Drift offset
      const driftEnabled =
        orb.drift === true || (typeof orb.drift === 'object' && orb.drift !== null);
      const offset = driftEnabled ? calculateDriftOffset(orb.orbitParams, time) : ZERO_OFFSET;

      const cx = (orb.position[0] + offset.x) * w;
      const cy = (orb.position[1] + offset.y) * h;
      const radius = orb.size * Math.max(w, h) * 0.65;

      // Radial gradient
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, orb.rgbaColor);
      gradient.addColorStop(0.7, orb.rgbaColorTransparent);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

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
