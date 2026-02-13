import type { BlendMode, OrbRenderConfig, OrbRenderer, OrbitParams } from '../types';
import { calculateDriftOffset, getOrbitParams } from '../utils/animation';
import { createCanvasRenderer } from './canvas-renderer';
import {
  FRAGMENT_SHADER_WEBGL1,
  FRAGMENT_SHADER_WEBGL2,
  VERTEX_SHADER_WEBGL1,
  VERTEX_SHADER_WEBGL2,
} from './shaders';

/** Maximum number of orbs supported by the WebGL renderer (uniform array size) */
const MAX_ORBS = 8;

// ─── Blend mode index mapping ──────────────────────────────────────────────────

/** Maps BlendMode strings to integer indices used in the GLSL shader */
export const BLEND_MODE_INDEX: Record<BlendMode, number> = {
  screen: 0,
  multiply: 1,
  overlay: 2,
  'hard-light': 3,
  'soft-light': 4,
  'color-dodge': 5,
  lighten: 6,
  normal: 7,
};

// ─── WebGL helpers ─────────────────────────────────────────────────────────────

/** Compile a WebGL shader, returning null on failure */
function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(`OrbKit: Shader compile error: ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Link a WebGL program from vertex + fragment shaders, returning null on failure */
function linkProgram(
  gl: WebGLRenderingContext,
  vertShader: WebGLShader,
  fragShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(`OrbKit: Program link error: ${gl.getProgramInfoLog(program)}`);
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/** Parse hex color to [r, g, b] floats (0-1) */
export function hexToVec3(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  if (cleaned.length < 6) return [0, 0, 0];
  const r = Number.parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = Number.parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = Number.parseInt(cleaned.substring(4, 6), 16) / 255;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return [0, 0, 0];
  return [r, g, b];
}

// ─── Internal orb with pre-computed orbit params ───────────────────────────────

interface InternalOrb extends OrbRenderConfig {
  orbitParams: OrbitParams;
  colorVec3: [number, number, number];
  blendModeIndex: number;
}

/** Shared zero offset to avoid per-frame allocation for non-drift orbs */
const ZERO_OFFSET: Readonly<{ x: number; y: number }> = { x: 0, y: 0 };

// ─── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a WebGL renderer implementing the OrbRenderer interface.
 * Uses WebGL2 with automatic WebGL1 fallback. Falls back to Canvas 2D
 * renderer if WebGL is not available at all.
 */
export function createWebGLRenderer(): OrbRenderer {
  if (typeof document === 'undefined') {
    return createCanvasRenderer();
  }

  let canvas: HTMLCanvasElement | null = null;
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let isWebGL2 = false;
  let animationId: number | null = null;
  let running = false;
  let orbs: InternalOrb[] = [];
  let background: [number, number, number] = [0, 0, 0];
  let grainIntensity = 0;
  let pointerX = 0.5;
  let pointerY = 0.5;

  // Uniform locations (set after program link)
  let uResolution: WebGLUniformLocation | null = null;
  let uTime: WebGLUniformLocation | null = null;
  let uOrbCount: WebGLUniformLocation | null = null;
  let uGrainIntensity: WebGLUniformLocation | null = null;
  let uBackground: WebGLUniformLocation | null = null;
  const uOrbColors: (WebGLUniformLocation | null)[] = [];
  const uOrbPositions: (WebGLUniformLocation | null)[] = [];
  const uOrbSizes: (WebGLUniformLocation | null)[] = [];
  const uOrbBlurs: (WebGLUniformLocation | null)[] = [];
  const uOrbBlendModes: (WebGLUniformLocation | null)[] = [];
  const uOrbWavy: (WebGLUniformLocation | null)[] = [];

  // WebGL1 needs a vertex buffer for the fullscreen triangle
  let vao: WebGLVertexArrayObject | null = null;
  let vertexBuffer: WebGLBuffer | null = null;

  function initShaders(): boolean {
    if (!gl) return false;

    const vertSource = isWebGL2 ? VERTEX_SHADER_WEBGL2 : VERTEX_SHADER_WEBGL1;
    const fragSource = isWebGL2 ? FRAGMENT_SHADER_WEBGL2 : FRAGMENT_SHADER_WEBGL1;

    const vert = compileShader(gl, gl.VERTEX_SHADER, vertSource);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
    if (!vert || !frag) return false;

    program = linkProgram(gl, vert, frag);
    if (!program) return false;

    // Clean up shader objects (linked into the program)
    gl.deleteShader(vert);
    gl.deleteShader(frag);

    // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL API, not a React hook
    gl.useProgram(program);

    // Cache uniform locations
    uResolution = gl.getUniformLocation(program, 'u_resolution');
    uTime = gl.getUniformLocation(program, 'u_time');
    uOrbCount = gl.getUniformLocation(program, 'u_orbCount');
    uGrainIntensity = gl.getUniformLocation(program, 'u_grainIntensity');
    uBackground = gl.getUniformLocation(program, 'u_background');

    for (let i = 0; i < MAX_ORBS; i++) {
      uOrbColors[i] = gl.getUniformLocation(program, `u_orbColors[${i}]`);
      uOrbPositions[i] = gl.getUniformLocation(program, `u_orbPositions[${i}]`);
      uOrbSizes[i] = gl.getUniformLocation(program, `u_orbSizes[${i}]`);
      uOrbBlurs[i] = gl.getUniformLocation(program, `u_orbBlurs[${i}]`);
      uOrbBlendModes[i] = gl.getUniformLocation(program, `u_orbBlendModes[${i}]`);
      uOrbWavy[i] = gl.getUniformLocation(program, `u_orbWavy[${i}]`);
    }

    return true;
  }

  function setupGeometry(): void {
    if (!gl || !program) return;

    if (isWebGL2) {
      // WebGL2: use VAO with no attributes (gl_VertexID handles positioning)
      const gl2 = gl as WebGL2RenderingContext;
      vao = gl2.createVertexArray();
      gl2.bindVertexArray(vao);
    } else {
      // WebGL1: need a vertex buffer for the fullscreen triangle
      vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const posLoc = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    }
  }

  function uploadOrbUniforms(): void {
    if (!gl) return;

    const count = Math.min(orbs.length, MAX_ORBS);
    gl.uniform1i(uOrbCount, count);

    for (let i = 0; i < count; i++) {
      const orb = orbs[i];
      if (!orb) continue;
      gl.uniform3f(uOrbColors[i] ?? null, orb.colorVec3[0], orb.colorVec3[1], orb.colorVec3[2]);
      gl.uniform1f(uOrbSizes[i] ?? null, orb.size);
      gl.uniform1f(uOrbBlurs[i] ?? null, orb.blur);
      gl.uniform1i(uOrbBlendModes[i] ?? null, orb.blendModeIndex);
      const wavyEnabled = orb.wavy === true || (typeof orb.wavy === 'object' && orb.wavy !== null);
      gl.uniform1i(uOrbWavy[i] ?? null, wavyEnabled ? 1 : 0);
    }
  }

  function render(time: number): void {
    if (!gl || !canvas || !program) return;

    const w = canvas.width;
    const h = canvas.height;

    gl.viewport(0, 0, w, h);
    gl.uniform2f(uResolution, w, h);
    gl.uniform1f(uTime, time / 1000);
    gl.uniform3f(uBackground, background[0], background[1], background[2]);
    gl.uniform1f(uGrainIntensity, grainIntensity);

    // Update orb positions with drift offsets
    const count = Math.min(orbs.length, MAX_ORBS);
    for (let i = 0; i < count; i++) {
      const orb = orbs[i];
      if (!orb) continue;
      const driftEnabled =
        orb.drift === true || (typeof orb.drift === 'object' && orb.drift !== null);
      const offset = driftEnabled ? calculateDriftOffset(orb.orbitParams, time) : ZERO_OFFSET;
      // Interactive parallax offset
      const interactiveIntensity = 0.35;
      const ix = orb.interactive ? (pointerX - orb.position[0]) * interactiveIntensity : 0;
      const iy = orb.interactive ? (pointerY - orb.position[1]) * interactiveIntensity : 0;
      gl.uniform2f(
        uOrbPositions[i] ?? null,
        orb.position[0] + offset.x + ix,
        orb.position[1] + offset.y + iy,
      );
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (running) {
      animationId = requestAnimationFrame(render);
    }
  }

  return {
    type: 'webgl' as const,

    mount(container: HTMLElement) {
      if (typeof document === 'undefined') return;

      canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';

      // Try WebGL2 first, fall back to WebGL1
      gl = canvas.getContext('webgl2') as WebGLRenderingContext | null;
      if (gl) {
        isWebGL2 = true;
      } else {
        gl =
          (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
          (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
        isWebGL2 = false;
      }

      if (!gl) {
        console.warn('OrbKit: WebGL not available, falling back to Canvas renderer');
        const fallback = createCanvasRenderer();
        fallback.mount(container);
        Object.assign(this, fallback);
        return;
      }

      container.appendChild(canvas);

      // Initial size
      const rect = container.getBoundingClientRect();
      const dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Initialize shaders and geometry
      if (!initShaders()) {
        console.warn('OrbKit: WebGL shader compilation failed, falling back to Canvas renderer');
        container.removeChild(canvas);
        const fallback = createCanvasRenderer();
        fallback.mount(container);
        Object.assign(this, fallback);
        return;
      }

      setupGeometry();
      uploadOrbUniforms();
    },

    unmount() {
      this.stop();
      if (canvas?.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
    },

    setOrbs(configs: OrbRenderConfig[]) {
      if (configs.length > MAX_ORBS) {
        console.warn(
          `OrbKit: WebGL renderer supports a maximum of ${MAX_ORBS} orbs. Only the first ${MAX_ORBS} will be rendered.`,
        );
      }
      orbs = configs.slice(0, MAX_ORBS).map((config, index) => ({
        ...config,
        orbitParams: getOrbitParams(config.position[0], config.position[1], index, 50),
        colorVec3: hexToVec3(config.color),
        blendModeIndex: BLEND_MODE_INDEX[config.blendMode] ?? 0,
      }));
      uploadOrbUniforms();
    },

    setBackground(color: string) {
      background = hexToVec3(color);
    },

    setGrain(intensity: number) {
      grainIntensity = intensity;
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
    },

    start() {
      if (running) return;
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

      if (gl && program) {
        gl.deleteProgram(program);
      }
      if (gl && vertexBuffer) {
        gl.deleteBuffer(vertexBuffer);
      }
      if (isWebGL2 && gl && vao) {
        (gl as WebGL2RenderingContext).deleteVertexArray(vao);
      }

      canvas = null;
      gl = null;
      program = null;
      vao = null;
      vertexBuffer = null;
      orbs = [];
    },
  };
}
