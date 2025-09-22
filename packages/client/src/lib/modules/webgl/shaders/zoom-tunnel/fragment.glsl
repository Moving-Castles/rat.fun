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
  float baseSpeed = 0.2; // Much lower starting speed
  float baseFreq = 1.0; // Much lower starting frequency
  float baseWave = 0.5; // Much lower starting wave intensity
  
  // Exponential intensity ramp over 8 seconds
  float rampTime = 8.0; // Peak time in seconds
  float intensity = 1.0 - exp(-t / (rampTime / 3.0)); // Exponential curve reaching ~0.95 at 8s
  float speedMultiplier = 0.1 + intensity * 2.9; // Speed increases from 0.1x to 3x
  float freqMultiplier = 0.2 + intensity * 2.3; // Frequency increases from 0.2x to 2.5x
  
  // Create the moving tunnel effect with intensity-based speed
  float u = r - t * baseSpeed * speedMultiplier;
  
  // Create seamless pattern by using sin/cos of the angle with intensity-based frequency
  float pattern = sin(a * baseFreq * freqMultiplier * 6.28318 + t * baseSpeed * speedMultiplier) * cos(a * baseFreq * freqMultiplier * 3.0 + t * baseSpeed * speedMultiplier * 0.5);
  
  // Generate trippy colors using the new seamless pattern with intensity-based wave
  vec3 col = palette(pattern + u * baseWave * (1.0 + intensity));
  
  // Add some variation based on radius with intensity-based animation
  col *= 0.5 + 0.5 * sin(r * 20.0 - t * 3.0 * baseSpeed * speedMultiplier);
  
  // Apply overall intensity boost to colors
  col *= 1.0 + intensity * 0.5;
  
  // Optional inversion
  if (u_invert) {
    col = vec3(1.0) - col;
  }
  
  gl_FragColor = vec4(col, 1.0);
}
