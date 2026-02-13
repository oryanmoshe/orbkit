import type { BlendMode, OrbRenderConfig, OrbRenderer, OrbitParams } from '../types';
import { calculateDriftOffset, getOrbitParams } from '../utils/animation';
import { createCanvasRenderer } from './canvas-renderer';

/** Maximum number of orbs supported by the WebGL renderer (uniform array size) */
const MAX_ORBS = 8;

// ─── Shader Sources ────────────────────────────────────────────────────────────

/** Fullscreen triangle vertex shader (WebGL2: gl_VertexID, WebGL1: attribute) */
const VERTEX_SHADER_WEBGL2 = `#version 300 es
void main() {
  // Fullscreen triangle from vertex ID — no buffers needed
  vec2 pos = vec2(
    float((gl_VertexID & 1) * 4 - 1),
    float((gl_VertexID & 2) * 2 - 1)
  );
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const VERTEX_SHADER_WEBGL1 = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * Fragment shader: renders orbs with simplex noise distortion, blend modes,
 * grain overlay, and anti-banding dither. Supports up to 8 orbs.
 */
const FRAGMENT_SHADER_BODY = `
uniform vec2 u_resolution;
uniform float u_time;
uniform int u_orbCount;
uniform vec3 u_orbColors[8];
uniform vec2 u_orbPositions[8];
uniform float u_orbSizes[8];
uniform float u_orbBlurs[8];
uniform int u_orbBlendModes[8];
uniform float u_grainIntensity;
uniform vec3 u_background;

// ─── Simplex Noise 3D (Ashima Arts / Ian McEwan) ───────────────────────────
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// ─── Fractal Brownian Motion ────────────────────────────────────────────────
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// ─── Anti-banding gradient noise (Jimenez) ──────────────────────────────────
float gradientNoise(vec2 uv) {
  return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));
}

// ─── Blend modes ────────────────────────────────────────────────────────────
vec3 blend_screen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blend_multiply(vec3 base, vec3 blend) {
  return base * blend;
}

vec3 blend_overlay_ch(vec3 base, vec3 blend) {
  return vec3(
    base.r < 0.5 ? 2.0 * base.r * blend.r : 1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r),
    base.g < 0.5 ? 2.0 * base.g * blend.g : 1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g),
    base.b < 0.5 ? 2.0 * base.b * blend.b : 1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b)
  );
}

vec3 blend_hard_light(vec3 base, vec3 blend) {
  return blend_overlay_ch(blend, base);
}

vec3 blend_soft_light(vec3 base, vec3 blend) {
  return vec3(
    blend.r < 0.5 ? base.r - (1.0 - 2.0 * blend.r) * base.r * (1.0 - base.r) : base.r + (2.0 * blend.r - 1.0) * (sqrt(base.r) - base.r),
    blend.g < 0.5 ? base.g - (1.0 - 2.0 * blend.g) * base.g * (1.0 - base.g) : base.g + (2.0 * blend.g - 1.0) * (sqrt(base.g) - base.g),
    blend.b < 0.5 ? base.b - (1.0 - 2.0 * blend.b) * base.b * (1.0 - base.b) : base.b + (2.0 * blend.b - 1.0) * (sqrt(base.b) - base.b)
  );
}

vec3 blend_color_dodge(vec3 base, vec3 blend) {
  return vec3(
    blend.r >= 1.0 ? 1.0 : min(1.0, base.r / (1.0 - blend.r)),
    blend.g >= 1.0 ? 1.0 : min(1.0, base.g / (1.0 - blend.g)),
    blend.b >= 1.0 ? 1.0 : min(1.0, base.b / (1.0 - blend.b))
  );
}

vec3 blend_lighten(vec3 base, vec3 blend) {
  return max(base, blend);
}

// Apply blend by mode index: 0=screen, 1=multiply, 2=overlay, 3=hard-light,
// 4=soft-light, 5=color-dodge, 6=lighten, 7=normal
vec3 applyBlend(vec3 base, vec3 blend, int mode) {
  if (mode == 1) return blend_multiply(base, blend);
  if (mode == 2) return blend_overlay_ch(base, blend);
  if (mode == 3) return blend_hard_light(base, blend);
  if (mode == 4) return blend_soft_light(base, blend);
  if (mode == 5) return blend_color_dodge(base, blend);
  if (mode == 6) return blend_lighten(base, blend);
  if (mode == 7) return mix(base, blend, 1.0); // normal — blend replaces base at alpha
  return blend_screen(base, blend); // 0 = screen (default)
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec3 color = u_background;

  for (int i = 0; i < 8; i++) {
    if (i >= u_orbCount) break;

    vec2 orbPos = u_orbPositions[i];
    float orbSize = u_orbSizes[i];
    float orbBlur = u_orbBlurs[i];

    // Distance from pixel to orb center (aspect-corrected)
    vec2 diff = uv - orbPos;
    diff.x *= aspect;
    float dist = length(diff);

    // Noise distortion for organic edges
    float noise = fbm(vec3(uv * 3.0, u_time * 0.3 + float(i)));
    dist += noise * 0.08;

    // Soft radial falloff
    float alpha = 1.0 - smoothstep(0.0, orbSize * (1.0 + orbBlur * 0.01), dist);

    // Blend orb color onto accumulated color
    vec3 orbContribution = u_orbColors[i] * alpha;
    color = applyBlend(color, orbContribution, u_orbBlendModes[i]);
  }

  // Grain overlay
  if (u_grainIntensity > 0.0) {
    float grain = gradientNoise(gl_FragCoord.xy) * u_grainIntensity;
    color += grain - u_grainIntensity * 0.5;
  }

  // Anti-banding dither
  color += (1.0 / 255.0) * gradientNoise(gl_FragCoord.xy + 0.5) - (0.5 / 255.0);

  ORBKIT_FRAG_OUT = vec4(color, 1.0);
}
`;

const FRAGMENT_SHADER_WEBGL2 = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
out vec4 ORBKIT_FRAG_OUT;
${FRAGMENT_SHADER_BODY}`;

const FRAGMENT_SHADER_WEBGL1 = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
#define ORBKIT_FRAG_OUT gl_FragColor
${FRAGMENT_SHADER_BODY}`;

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
      gl.uniform2f(
        uOrbPositions[i] ?? null,
        orb.position[0] + offset.x,
        orb.position[1] + offset.y,
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
