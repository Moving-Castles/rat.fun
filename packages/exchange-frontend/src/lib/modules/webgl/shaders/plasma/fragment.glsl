precision mediump float;

// ============================================================================
// CONFIGURATION VARIABLES
// ============================================================================

// Plasma effect parameters
#define RADIAL_FREQUENCY 10.0      // Controls radial wave frequency
#define RADIAL_SPEED 2.0           // Controls radial animation speed
#define ANGULAR_FREQUENCY 8.0      // Controls angular wave frequency  
#define ANGULAR_SPEED 1.0          // Controls angular animation speed
#define HIGH_FREQ_FREQUENCY 20.0   // Controls high frequency detail
#define HIGH_FREQ_SPEED 0.5        // Controls high frequency animation speed

// Color mixing weights for RGB channels
#define RED_WEIGHT 0.5
#define GREEN_WEIGHT 0.3
#define BLUE_WEIGHT 1.0

// Brightness control to reduce white highlights
#define MAX_BRIGHTNESS 0.7  // Reduce from 1.0 to 0.7 to avoid pure white

// Precomputed constants for optimization
#define HALF_PI 1.57079632679      // π/2 for atan optimization
#define INV_THREE 0.33333333333    // 1/3 for division optimization

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
  
  // Center coordinates around origin (optimized: removed unnecessary * 1.0)
  vec2 p = uv - 0.5;
  
  // Convert to polar coordinates
  float a = atan(p.y, p.x);  // Angle from center
  float r = length(p);       // Distance from center
  
  // Precompute time-based phases for all layers (reduces redundant multiplications)
  float time_phase1 = u_time * RADIAL_SPEED;
  float time_phase2 = u_time * ANGULAR_SPEED;
  float time_phase3 = u_time * HIGH_FREQ_SPEED;
  
  // Create layered plasma effect using multiple sine waves
  // Each layer adds different visual complexity:
  
  // Layer 1: Radial waves (concentric circles)
  float plasma = sin(r * RADIAL_FREQUENCY - time_phase1) * 0.5 + 0.5;
  
  // Layer 2: Angular waves (spokes from center)
  plasma += sin(a * ANGULAR_FREQUENCY + time_phase2) * 0.5 + 0.5;
  
  // Layer 3: High frequency detail (fine texture)
  plasma += sin(r * HIGH_FREQ_FREQUENCY + time_phase3) * 0.5 + 0.5;
  
  // Apply color mixing with different weights for each RGB channel
  vec3 color = vec3(plasma * RED_WEIGHT, plasma * GREEN_WEIGHT, plasma * BLUE_WEIGHT);
  
  // Reduce maximum brightness to avoid pure white highlights
  color *= MAX_BRIGHTNESS;
  
  // Apply color inversion if enabled (optimized: use conditional assignment)
  color = u_invert ? vec3(1.0) - color : color;
  
  // Output final color with full alpha
  gl_FragColor = vec4(color, 1.0);
} 