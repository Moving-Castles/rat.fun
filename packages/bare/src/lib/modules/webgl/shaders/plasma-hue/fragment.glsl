precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// RGB to HSV conversion
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = (uv - 0.5) * 2.0;
  
  float a = atan(p.y, p.x);
  float r = length(p);
  
  // Create plasma effect
  float plasma = sin(r * 10.0 - u_time * 2.0) * 0.5 + 0.5;
  plasma += sin(a * 8.0 + u_time) * 0.5 + 0.5;
  plasma += sin(r * 20.0 + u_time * 0.5) * 0.5 + 0.5;
  
  // Normalize plasma value to 0-1 range
  plasma = clamp(plasma / 3.0, 0.0, 1.0);
  
  // Create base color with hue rotation
  float hue = mod(u_time * 0.5, 1.0); // Rotate hue over time
  float saturation = 0.8;
  float value = plasma * 0.8 + 0.2; // Use plasma for brightness variation
  
  // Convert HSV to RGB
  vec3 color = hsv2rgb(vec3(hue, saturation, value));
  
  gl_FragColor = vec4(color, 1.0);
} 