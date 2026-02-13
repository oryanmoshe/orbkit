// OrbKit fragment shader — renders up to 8 orbs with noise distortion,
// blend modes, grain overlay, and anti-banding dither.
//
// Preamble (precision, version, output variable) is prepended by host code
// to support both WebGL2 (#version 300 es + out vec4) and WebGL1 (gl_FragColor).
// The output variable is named ORBKIT_FRAG_OUT via #define or declaration.

// ─── Uniforms ───────────────────────────────────────────────────────────────

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
  if (mode == 7) return mix(base, blend, 1.0);
  return blend_screen(base, blend);
}

// ─── Main ───────────────────────────────────────────────────────────────────

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
