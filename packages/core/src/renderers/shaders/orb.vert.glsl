// Fullscreen triangle — covers entire viewport with a single triangle.
// WebGL2: uses gl_VertexID (no vertex buffer needed).
// For WebGL1, the host code uses a separate shader with a_position attribute.

#version 300 es

void main() {
  vec2 pos = vec2(
    float((gl_VertexID & 1) * 4 - 1),
    float((gl_VertexID & 2) * 2 - 1)
  );
  gl_Position = vec4(pos, 0.0, 1.0);
}
