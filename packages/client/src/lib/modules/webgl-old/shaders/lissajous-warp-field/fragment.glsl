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
  float zoom = 0.3; // Zoom speed
  
  // Scale coordinates for inward effect
  p *= 1.0 + t * zoom;
  
  // Warp coordinates using Lissajous curves
  p += 0.05 * vec2(sin(p.y * 10.0 + t), sin(p.x * 12.0 - t));
  
  // Lissajous pattern parameters
  float cx = 8.0;  // X frequency
  float cy = 6.0;  // Y frequency
  
  // Create thin curvy lines using Lissajous pattern
  float d = abs(sin(p.x * cx) + sin(p.y * cy));
  
  // Create thin lines by thresholding
  float line = step(0.8, d);
  
  // Generate colors using palette
  vec3 col = palette(d);
  
  // Apply line pattern
  col *= line;
  
  // Optional inversion
  if (u_invert) {
    col = vec3(1.0) - col;
  }
  
  gl_FragColor = vec4(col, 1.0);
}
