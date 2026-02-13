# Plan 07: WebGL Renderer

## Problem

The WebGL renderer is an empty stub. WebGL produces the highest quality orb effects — flowing gradients with organic noise distortion, GPU-accelerated at 60fps. This is what sites like Stripe use.

## Research Summary

### How Stripe Does It

Stripe uses a custom ~10KB WebGL implementation ("minigl") with GLSL fragment shaders. Key techniques:
- Simplex noise (3D) for organic displacement
- Fractal Brownian Motion (layered noise octaves) for detail
- Anti-banding gradient noise (Jorge Jimenez technique)
- Smoothstep-based soft edges (no pixel-sampled blur)
- Single-pass rendering (no intermediate textures)

### ReactBits Orb Reference

Uses OGL (minimal WebGL library) + custom GLSL:
- `snoise3` for waviness
- YIQ color space for hue rotation
- Hover distortion via sin wave displacement
- 3 base colors blended dynamically

## Architecture

### Library Choice: Raw WebGL vs OGL

| Option | Size | API | Maintenance |
|--------|------|-----|-------------|
| Raw WebGL | 0KB dep | Verbose | Full control |
| OGL | ~10KB | Clean | Active |
| Three.js | ~150KB | Overkill | Active |

**Recommended: Raw WebGL** — OrbKit's WebGL needs are limited (fullscreen quad + fragment shader). No 3D scene graph needed. Keeps bundle size minimal.

If raw WebGL proves too verbose, OGL is the fallback — it's lightweight and provides a clean shader/mesh abstraction.

### Shader Architecture

Single fullscreen quad with a fragment shader that computes all orbs:

```text
Vertex Shader: Fullscreen triangle (3 vertices, no buffers needed with WebGL2)
Fragment Shader: For each pixel:
  1. For each orb: compute distance from pixel to orb center
  2. Apply radial falloff with noise distortion
  3. Blend orb colors using selected blend mode
  4. Add grain noise
  5. Apply anti-banding dither
```

### Fragment Shader Design

```glsl
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform int u_orbCount;
uniform vec3 u_orbColors[8];     // Max 8 orbs (clamped — see note below)
uniform vec2 u_orbPositions[8];  // Normalized 0-1
uniform float u_orbSizes[8];     // Normalized radius
uniform float u_orbBlurs[8];     // Blur amount
uniform float u_grainIntensity;
uniform vec3 u_background;

// Simplex noise 3D (Ashima Arts / Ian McEwan)
// ~40 lines, well-established implementation

// Fractal Brownian Motion
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

// Anti-banding gradient noise (Jimenez)
float gradientNoise(vec2 uv) {
  return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));
}

// Screen blend
vec3 blend_screen(vec3 a, vec3 b) {
  return 1.0 - (1.0 - a) * (1.0 - b);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 color = u_background;

  for (int i = 0; i < 8; i++) {
    if (i >= u_orbCount) break;

    vec2 orbPos = u_orbPositions[i];
    float orbSize = u_orbSizes[i];
    float orbBlur = u_orbBlurs[i];

    // Distance from pixel to orb center (aspect-corrected)
    float aspect = u_resolution.x / u_resolution.y;
    vec2 diff = uv - orbPos;
    diff.x *= aspect;
    float dist = length(diff);

    // Noise distortion for organic edges
    float noise = fbm(vec3(uv * 3.0, u_time * 0.3 + float(i)));
    dist += noise * 0.08;

    // Soft radial falloff
    float alpha = 1.0 - smoothstep(0.0, orbSize * (1.0 + orbBlur * 0.01), dist);

    // Blend orb color onto accumulated color
    color = blend_screen(color, u_orbColors[i] * alpha);
  }

  // Grain overlay
  if (u_grainIntensity > 0.0) {
    float grain = gradientNoise(gl_FragCoord.xy) * u_grainIntensity;
    color += grain - u_grainIntensity * 0.5;
  }

  // Anti-banding dither
  color += (1.0 / 255.0) * gradientNoise(gl_FragCoord.xy + 0.5) - (0.5 / 255.0);

  gl_FragColor = vec4(color, 1.0);
}
```

### Orb Count Clamping

Uniform arrays are fixed at 8 elements. The host code **must** clamp `u_orbCount` to a maximum of 8 before uploading uniforms. If the consumer provides more than 8 orbs, only the first 8 are rendered and a console warning is emitted:

```typescript
const MAX_ORBS = 8;

function setOrbs(orbs: OrbRenderConfig[]) {
  if (orbs.length > MAX_ORBS) {
    console.warn(`OrbKit: WebGL renderer supports a maximum of ${MAX_ORBS} orbs. Only the first ${MAX_ORBS} will be rendered.`);
  }
  const clamped = orbs.slice(0, MAX_ORBS);
  gl.uniform1i(orbCountLocation, clamped.length);
  // ... upload clamped orb uniforms
}
```

### Uniform Updates (Animation Loop)

```typescript
function animate(time: number) {
  gl.uniform1f(timeLocation, time / 1000);

  // Update orb positions with drift
  for (let i = 0; i < orbs.length; i++) {
    const offset = calculateDriftOffset(orbs[i], time);
    gl.uniform2f(
      positionLocations[i],
      orbs[i].position[0] + offset[0],
      orbs[i].position[1] + offset[1]
    );
  }

  // Draw fullscreen quad
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  animationId = requestAnimationFrame(animate);
}
```

### Mouse Interactivity

Pass mouse position as uniform for hover effects:

```glsl
uniform vec2 u_mouse;       // Normalized 0-1
uniform float u_mouseActive; // 0 or 1

// In main():
if (u_mouseActive > 0.5) {
  // Warp UVs based on distance to mouse
  vec2 toMouse = u_mouse - uv;
  float mouseDist = length(toMouse);
  uv += toMouse * 0.05 / (mouseDist + 0.1);
}
```

## Implementation Steps

1. **WebGL boilerplate**: Create canvas, get context, compile shaders, create program
2. **Fullscreen triangle**: Vertex shader with `gl_VertexID` (WebGL2) or a 3-vertex buffer (WebGL1)
3. **Simplex noise in GLSL**: Include the standard Ashima implementation
4. **Orb rendering**: Loop over orb uniforms, compute distance + noise + falloff
5. **Blend modes**: Implement screen, multiply, overlay, hard-light in GLSL
6. **Grain**: In-shader noise generation
7. **Anti-banding**: Gradient noise dithering
8. **Animation loop**: requestAnimationFrame updating time + drift positions
9. **Resize handling**: Update canvas size + viewport + resolution uniform
10. **Mouse tracking**: Uniform updates for interactive orbs

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/renderers/webgl-renderer.ts` | Full implementation |
| `packages/core/src/renderers/shaders/orb.vert` | Vertex shader (or inline) |
| `packages/core/src/renderers/shaders/orb.frag` | Fragment shader (or inline) |

Consider inlining shaders as template literals to avoid build complexity with .glsl file imports.

## WebGL1 vs WebGL2

WebGL2 is supported by 97%+ of browsers (2024 data). Advantages:
- `gl_VertexID` eliminates need for vertex buffer
- Uniform buffer objects for cleaner orb data passing
- Better integer support in shaders

**Recommended: WebGL2 with WebGL1 fallback** (or just WebGL2 — mobile Safari supports it since iOS 15).

## Performance Targets

- 8 orbs @ 1080p: 60fps on integrated GPUs
- 8 orbs @ 4K: 60fps on discrete GPUs
- Shader compile time: < 100ms
- Memory: ~1MB (canvas + shader program)

## Fallback Strategy

```typescript
function createWebGLRenderer(options) {
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    console.warn('OrbKit: WebGL not available, falling back to Canvas renderer');
    return createCanvasRenderer(options);
  }
  // ...
}
```

## Testing

- WebGL context creation succeeds
- Shader compilation succeeds (no GLSL errors)
- Orbs render at correct positions
- Blend modes produce visually correct output
- Grain intensity scales correctly
- Resize updates viewport
- Animation runs at target framerate
- Destroy cleans up GL resources (program, buffers, textures)
- Graceful fallback when WebGL unavailable
