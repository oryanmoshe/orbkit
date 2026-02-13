import type { BlendMode, OrbitParams } from '../types';
import { calculateDriftOffset, getOrbitParams } from '../utils/animation';
import { hexToRgba } from '../utils/color';
import type { OrbRenderConfig, OrbRenderer } from './renderer-interface';

/** Blend mode mapping: CSS mix-blend-mode → Canvas globalCompositeOperation */
const BLEND_MODE_MAP: Record<BlendMode, GlobalCompositeOperation> = {
  screen: 'screen',
  multiply: 'multiply',
  overlay: 'overlay',
  'hard-light': 'hard-light',
  'soft-light': 'soft-light',
  'color-dodge': 'color-dodge',
  lighten: 'lighten',
  normal: 'source-over',
};

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
  let cachedGrain: ImageData | null = null;
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
      const offset = driftEnabled ? calculateDriftOffset(orb.orbitParams, time) : { x: 0, y: 0 };

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

    // Grain overlay
    if (grainIntensity > 0) {
      renderGrain(w, h);
    }

    if (running) {
      animationId = requestAnimationFrame(render);
    }
  }

  function renderGrain(w: number, h: number) {
    if (!ctx) return;

    // Generate and cache grain at current resolution
    if (!cachedGrain || cachedGrain.width !== w || cachedGrain.height !== h) {
      cachedGrain = generateGrainData(w, h, grainIntensity);
    }

    ctx.globalCompositeOperation = 'overlay';
    ctx.putImageData(cachedGrain, 0, 0);
  }

  return {
    type: 'canvas' as const,

    mount(container: HTMLElement) {
      canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      ctx = canvas.getContext('2d');
      container.appendChild(canvas);

      // Initial size from container
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
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
      cachedGrain = null; // invalidate cache when intensity changes
    },

    resize(width: number, height: number) {
      if (!canvas) return;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      cachedGrain = null; // invalidate grain cache on resize
    },

    start() {
      running = true;
      animationId = requestAnimationFrame(render);
    },

    stop() {
      running = false;
      if (animationId !== null) {
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
      cachedGrain = null;
    },
  };
}

/** Generate noise ImageData for grain overlay */
function generateGrainData(w: number, h: number, intensity: number): ImageData {
  const imageData = new ImageData(w, h);
  const data = imageData.data;
  const alpha = Math.round(intensity * 128);

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.random() * 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = alpha;
  }

  return imageData;
}
