precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 color = vec3(uv.x, uv.y, sin(u_time) * 0.5 + 0.5);
  gl_FragColor = vec4(color, 1.0);
} 