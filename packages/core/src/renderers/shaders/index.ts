/**
 * Shader source strings for the WebGL renderer.
 *
 * The canonical shader source lives in the .glsl files alongside this module
 * (orb.vert.glsl, orb.frag.glsl) for syntax highlighting and GLSL tooling.
 * Bun's --loader .glsl:text flag imports them as raw strings at build time.
 */

import fragmentBody from './orb.frag.glsl';

// ─── Vertex Shaders ─────────────────────────────────────────────────────────

/** Fullscreen triangle vertex shader for WebGL2 (uses gl_VertexID, no buffers needed) */
export { default as VERTEX_SHADER_WEBGL2 } from './orb.vert.glsl';

/** Fullscreen triangle vertex shader for WebGL1 (requires a_position attribute buffer) */
export const VERTEX_SHADER_WEBGL1 = /* glsl */ `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// ─── Fragment Shaders ────────────────────────────────────────────────────────

/** Complete fragment shader for WebGL2 (GLSL ES 3.00) */
export const FRAGMENT_SHADER_WEBGL2 = /* glsl */ `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
out vec4 ORBKIT_FRAG_OUT;
${fragmentBody}`;

/** Complete fragment shader for WebGL1 (GLSL ES 1.00) */
export const FRAGMENT_SHADER_WEBGL1 = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
#define ORBKIT_FRAG_OUT gl_FragColor
${fragmentBody}`;
