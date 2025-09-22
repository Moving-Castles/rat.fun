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
  
  // Fix aspect ratio to ensure circular tunnel
  p.x *= u_resolution.x / u_resolution.y;
  
  float r = length(p);
  float a = atan(p.y, p.x);
  
  // Time-based animation parameters
  float t = u_time;
  float speed = 0.8; // Reduced speed
  float freq = 3.0;
  float wave = 2.0;
  
  // Create the moving tunnel effect
  float u = r - t * speed;
  
  // Create seamless pattern by using sin/cos of the angle
  float pattern = sin(a * freq * 6.28318 + t * speed) * cos(a * freq * 3.0 + t * speed * 0.5);
  
  // Generate trippy colors using the new seamless pattern
  vec3 col = palette(pattern + u * wave);
  
  // Add some variation based on radius
  col *= 0.5 + 0.5 * sin(r * 20.0 - t * 3.0);
  
  // Optional inversion
  if (u_invert) {
    col = vec3(1.0) - col;
  }
  
  gl_FragColor = vec4(col, 1.0);
}
