precision mediump float;

attribute vec2 a_position;

uniform float u_time;
uniform vec2 u_resolution;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
} 