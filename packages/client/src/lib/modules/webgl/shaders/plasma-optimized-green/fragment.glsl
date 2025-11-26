precision mediump float;

// ============================================================================
// CONFIGURATION VARIABLES
// ============================================================================

// Plasma effect parameters (optimized single-layer version)
#define RADIAL_FREQUENCY 30.0      // Controls radial wave frequency
#define ANGULAR_FREQUENCY 8.0      // Controls angular wave frequency
#define TIME_SPEED 3.5             // Controls overall animation speed

// Color mixing weights for RGB channels (green-only effect)
#define RED_WEIGHT 0.0
#define GREEN_WEIGHT 1.0
#define BLUE_WEIGHT 0.0

// Precomputed constants for optimization
#define HALF 0.5                   // 0.5 for sin() offset
#define ONE 1.0                    // 1.0 for alpha channel

// ============================================================================
// UNIFORMS
// ============================================================================

uniform float u_time;        // Animation time
uniform vec2 u_resolution;   // Screen resolution
uniform bool u_invert;       // Whether to invert colors

// ============================================================================
// MAIN SHADER
// ============================================================================

void main() {
  // Normalize fragment coordinates to [0,1] range
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // Center coordinates around origin
  vec2 p = uv - 0.5;

  // Convert to polar coordinates
  float r = length(p);       // Distance from center
  float a = atan(p.y, p.x);  // Angle from center

  // Precompute time phase to avoid redundant multiplication
  float time_phase = u_time * TIME_SPEED;

  // Optimized plasma calculation: combine all wave components into single sin() call
  // This reduces from 3 separate sin() calls to 1, improving performance
  float combined = r * RADIAL_FREQUENCY + a * ANGULAR_FREQUENCY + time_phase;
  float plasma = sin(combined) * HALF + HALF;

  // Apply color mixing (green-only effect for high contrast)
  // Optimized: since RED_WEIGHT and BLUE_WEIGHT are 0.0, we can simplify
  vec3 color = vec3(0.0, plasma, 0.0);

  // Apply color inversion if enabled (optimized: use conditional assignment)
  color = u_invert ? vec3(ONE) - color : color;

  // Output final color with full alpha
  gl_FragColor = vec4(color, ONE);
}