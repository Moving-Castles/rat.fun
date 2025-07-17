precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = (uv - 0.5) * 2.0;
  
  float a = atan(p.y, p.x);
  float r = length(p);
  
  float plasma = sin(r * 10.0 - u_time * 2.0) * 0.5 + 0.5;
  plasma += sin(a * 8.0 + u_time) * 0.5 + 0.5;
  plasma += sin(r * 20.0 + u_time * 0.5) * 0.5 + 0.5;
  
  vec3 color = vec3(plasma * 0.5, plasma * 0.3, plasma);
  gl_FragColor = vec4(color, 1.0);
} 