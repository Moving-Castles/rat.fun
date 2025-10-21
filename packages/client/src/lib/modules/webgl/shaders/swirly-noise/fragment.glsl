precision mediump float;

// ============================================================================
// CONFIGURATION VARIABLES
// ============================================================================


// Swirl effect parameters
#define SWIRL_BASE_STRENGTH 2.0    // Base strength of swirl effect
#define SWIRL_SPEED 0.1            // Speed of swirl animation

// Noise generation parameters
#define NOISE_SCALE 3.0            // Scale factor for noise coordinates
#define NOISE_OCTAVES 4            // Number of noise octaves for fractal noise
#define NOISE_AMPLITUDE 0.5        // Initial noise amplitude
#define NOISE_FREQUENCY 1.0        // Initial noise frequency
#define NOISE_PERSISTENCE 0.5      // Noise amplitude decay per octave
#define NOISE_LACUNARITY 2.0       // Noise frequency increase per octave

// Color parameters
#define DARK_GREY_R 0.65           // Dark grey color - Red component
#define DARK_GREY_G 0.25           // Dark grey color - Green component
#define DARK_GREY_B 0.65           // Dark grey color - Blue component
#define NOISE_POWER 2.0            // Power curve for noise variation
#define NOISE_OPACITY 0.8          // Opacity multiplier for noise

// Hash function constants
#define HASH_CONST_1 127.1         // Hash function constant 1
#define HASH_CONST_2 311.7         // Hash function constant 2
#define HASH_MULTIPLIER 43758.5453 // Hash function multiplier

// Mathematical constants
#define HALF 0.5                   // 0.5 for centering
#define ONE 1.0                    // 1.0 for full values
#define TWO 2.0                    // 2.0 for doubling
#define THREE 3.0                  // 3.0 for cubic smoothing
#define ZERO 0.0                   // 0.0 for zero values

// ============================================================================
// UNIFORMS
// ============================================================================

uniform float u_time;        // Animation time
uniform vec2 u_resolution;   // Screen resolution

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Simple hash function for noise generation
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(HASH_CONST_1, HASH_CONST_2))) * HASH_MULTIPLIER);
}

// Smooth interpolation using cubic smoothing
float smoothNoise(vec2 p) {
  vec2 i = floor(p);           // Integer part for grid lookup
  vec2 f = fract(p);           // Fractional part for interpolation
  f = f * f * (THREE - TWO * f); // Cubic smoothing function
  
  // Sample noise at four corners of the grid cell
  float a = hash(i);
  float b = hash(i + vec2(ONE, ZERO));
  float c = hash(i + vec2(ZERO, ONE));
  float d = hash(i + vec2(ONE, ONE));
  
  // Bilinear interpolation
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal noise for organic texture generation
float fractalNoise(vec2 p) {
  float value = ZERO;
  float amplitude = NOISE_AMPLITUDE;
  float frequency = NOISE_FREQUENCY;
  
  // Generate multiple octaves of noise for fractal detail
  for(int i = 0; i < NOISE_OCTAVES; i++) {
    value += amplitude * smoothNoise(p * frequency);
    amplitude *= NOISE_PERSISTENCE;  // Decrease amplitude each octave
    frequency *= NOISE_LACUNARITY;   // Increase frequency each octave
  }
  
  return value;
}

// Create swirl effect using rotation matrix with continuous inwards movement
vec2 swirl(vec2 p, float strength, float time) {
  float angle = length(p) * strength + time;
  float c = cos(angle);
  float s = sin(angle);
  mat2 rotation = mat2(c, -s, s, c);
  return rotation * p;
}

// ============================================================================
// MAIN SHADER
// ============================================================================

void main() {
  // Normalize fragment coordinates to [0,1] range
  vec2 uv = gl_FragCoord.xy / u_resolution;
  
  // Center coordinates and scale to [-1,1] range
  vec2 p = (uv - HALF) * TWO;
  
  // Create gentle swirl effect with continuous inwards movement
  p = swirl(p, SWIRL_BASE_STRENGTH, u_time * SWIRL_SPEED);
  
  // Scale coordinates for noise generation
  p *= NOISE_SCALE;
  
  // Generate fractal noise
  float noise = fractalNoise(p);
  
  // Apply power curve for subtle variations
  noise = pow(noise, NOISE_POWER);
  
  // Define color palette (dark grey and black)
  vec3 darkGrey = vec3(DARK_GREY_R, DARK_GREY_G, DARK_GREY_B);
  vec3 black = vec3(ZERO, ZERO, ZERO);
  
  // Mix between dark grey and black based on noise
  vec3 color = mix(black, darkGrey, noise * NOISE_OPACITY);
  
  // Output final color with full alpha
  gl_FragColor = vec4(color, ONE);
}
