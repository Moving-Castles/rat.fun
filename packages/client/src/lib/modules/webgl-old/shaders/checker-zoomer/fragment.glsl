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
  float zoom = 0.5; // Zoom speed
  
  // Create inward zoom effect using exponential decay
  float s = exp(-t * zoom);
  
  // Scale coordinates for checker pattern
  vec2 q = p * s;
  
  // Create high-contrast checker pattern using XOR
  float checkerX = step(0.5, fract(q.x));
  float checkerY = step(0.5, fract(q.y));
  float checker = checkerX != checkerY ? 1.0 : 0.0;
  
  // Add color cycling based on position
  float colorCycle = q.x + q.y;
  vec3 col = palette(colorCycle * 0.5 + t * 0.2);
  
  // Apply checker pattern
  col *= checker;
  
  // Optional inversion
  if (u_invert) {
    col = vec3(1.0) - col;
  }
  
  gl_FragColor = vec4(col, 1.0);
}
