precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform bool u_invert;

// Color palette function for trippy colors
vec3 palette(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.263, 0.416, 0.557);
  
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  // Use UV coordinates
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (uv - 0.5) * 2.0;
  
  // Fix aspect ratio
  p.x *= u_resolution.x / u_resolution.y;
  
  // Time parameters
  float t = u_time;
  float zoom = 0.2; // Zoom speed
  
  // Animate scale for "inward" effect
  p *= 1.0 + t * zoom;
  
  // Plasma parameters
  float ax = 3.0;  // X frequency
  float ay = 4.0;  // Y frequency  
  float az = 2.0;  // Combined frequency
  
  // Classic plasma formula
  float v = sin(p.x * ax + t) + sin(p.y * ay - t) + sin((p.x + p.y) * az + t);
  
  // Normalize to [0, 1] range and apply palette
  float plasma = v * 0.5 + 0.5;
  vec3 col = palette(plasma);
  
  // Add some variation for more psychedelic effect
  col *= 0.8 + 0.2 * sin(t * 0.5);
  
  // Optional inversion
  if (u_invert) {
    col = vec3(1.0) - col;
  }
  
  gl_FragColor = vec4(col, 1.0);
}
