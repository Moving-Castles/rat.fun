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
  
  // Convert to polar coordinates
  float r = length(p);
  float a = atan(p.y, p.x);
  
  // Time parameters
  float t = u_time;
  float zoom = 0.5; // Zoom speed
  
  // Scale radius for inward effect
  r *= 1.0 + t * zoom;
  
  // Kaleidoscope parameters
  float k = 6.0; // number of symmetry slices
  float ka = mod(a, 6.28318 / k);
  
  // Create the kaleidoscope pattern
  float v = sin(r * 20.0 - t * 3.0 + ka * 5.0);
  
  // Generate colors using palette
  vec3 col = palette(v * 0.5 + 0.5);
  
  // Add some variation for more stained glass effect
  col *= 0.8 + 0.2 * sin(r * 10.0 - t * 2.0);
  
  // Optional inversion
  if (u_invert) {
    col = vec3(1.0) - col;
  }
  
  gl_FragColor = vec4(col, 1.0);
}
