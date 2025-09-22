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
  // Use UV coordinates directly to avoid seams
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (uv - 0.5) * 2.0;
  
  // Fix aspect ratio to ensure circular vortex
  p.x *= u_resolution.x / u_resolution.y;
  
  float r = length(p);
  float a = atan(p.y, p.x);
  
  // Spiral vortex parameters
  float t = u_time;
  float k = 2.0;        // Spiral tightness
  float spin = 0.3;     // Rotation speed (reduced from 1.0)
  float arms = 4.0;     // Number of spiral arms
  
  // Create spiral effect: rotate angle based on radius and time
  // Use a smoother function to avoid extreme values
  a += k * log(r + 0.5) - t * spin;
  
  // Create the spiral pattern using fractional angle
  float pattern = fract(a * arms);
  
  // Generate trippy colors using the palette
  vec3 col = palette(pattern);
  
  // Add some variation based on radius
  col *= 0.5 + 0.5 * sin(r * 15.0 - t * 2.0);
  
  // Optional inversion
  if (u_invert) {
    col = vec3(1.0) - col;
  }
  
  gl_FragColor = vec4(col, 1.0);
}
