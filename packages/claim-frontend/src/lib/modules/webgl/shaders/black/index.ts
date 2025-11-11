/**
 * Black shader - simple solid black background
 */

export const black = {
  vertex: `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `,
  fragment: `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform bool u_invert;

    void main() {
      // Solid black (or white if inverted)
      gl_FragColor = u_invert ? vec4(1.0, 1.0, 1.0, 1.0) : vec4(0.0, 0.0, 0.0, 1.0);
    }
  `
}
