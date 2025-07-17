precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float wave = sin(uv.x * 10.0 + u_time) * 0.5 + 0.5;
  wave *= sin(uv.y * 8.0 + u_time * 0.8) * 0.5 + 0.5;
  
  vec3 color = vec3(0.2, 0.6, 1.0) * wave;
  gl_FragColor = vec4(color, 1.0);
} 