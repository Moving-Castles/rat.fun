precision mediump float;

// ============================================================================
// CONFIGURATION VARIABLES
// ============================================================================

// CRT effect parameters
#define SCANLINE_INTENSITY 0.08           // Intensity of horizontal scanlines
#define SCANLINE_SPEED 0.015              // Speed of scanline animation
#define CHROMATIC_ABERRATION 0.0002       // Amount of chromatic aberration
#define CHROMATIC_ABERRATION_SCALED 0.01  // Pre-scaled aberration value (reduced for B&W)

// Sky gradient colors (grayscale)
#define SKY_COLOR_TOP 0.15                // Top sky color (dark gray)
#define SKY_COLOR_BOTTOM 0.35             // Bottom sky color (medium gray)

// Cloud layer scaling factors
#define CLOUD_SCALE_1 1.0          // Primary cloud layer scale
#define CLOUD_SCALE_2 0.7          // Secondary cloud layer scale
#define CLOUD_SCALE_3 0.5          // Tertiary cloud layer scale

// Cloud animation parameters
#define CLOUD_SPEED_1 0.15         // Primary cloud layer animation speed (slower)
#define CLOUD_SPEED_2 0.08         // Secondary cloud layer animation speed
#define CLOUD_SPEED_3 0.25         // Tertiary cloud layer animation speed

// Cloud generation parameters
#define CLOUD_FREQ_1 3.0           // Primary cloud layer frequency
#define CLOUD_FREQ_2 5.0           // Secondary cloud layer frequency
#define CLOUD_FREQ_3 2.0           // Tertiary cloud layer frequency

// Cloud appearance parameters
#define CLOUD_THRESHOLD_LOW 0.4    // Lower threshold for cloud visibility
#define CLOUD_THRESHOLD_HIGH 0.6   // Upper threshold for cloud visibility
#define CLOUD_OPACITY 0.6          // Cloud opacity multiplier (reduced for muted look)
#define CLOUD_BRIGHTNESS 0.5       // Cloud brightness (gray clouds instead of white)
#define SCANLINE_FREQ 0.7          // Scanline frequency multiplier

// Noise generation parameters
#define NOISE_OCTAVES 4            // Number of noise octaves for fractal noise
#define NOISE_AMPLITUDE 0.5        // Initial noise amplitude
#define NOISE_FREQUENCY 1.0        // Initial noise frequency
#define NOISE_PERSISTENCE 0.5      // Noise amplitude decay per octave
#define NOISE_LACUNARITY 2.0       // Noise frequency increase per octave

// Hash function constants
#define HASH_CONST_1 127.1         // Hash function constant 1
#define HASH_CONST_2 311.7         // Hash function constant 2
#define HASH_MULTIPLIER 43758.5453 // Hash function multiplier

// Brightness control
#define BRIGHTNESS 0.9             // Overall brightness multiplier (slightly muted)

// Precomputed constants for optimization
#define HALF 0.5                   // 0.5 for sin() offset
#define ONE 1.0                    // 1.0 for alpha channel
#define ZERO 0.0                   // 0.0 for zero values

// ============================================================================
// UNIFORMS
// ============================================================================

uniform float u_time;        // Animation time
uniform vec2 u_resolution;   // Screen resolution
uniform bool u_invert;       // Whether to invert colors

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
  f = f * f * (3.0 - 2.0 * f); // Cubic smoothing function

  // Sample noise at four corners of the grid cell
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  // Bilinear interpolation
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal noise for realistic cloud generation
float fractalNoise(vec2 p) {
  float value = 0.0;
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

// ============================================================================
// CRT EFFECT FUNCTIONS
// ============================================================================

// Generate horizontal scanlines for CRT effect
float crtScanlines(vec2 uv) {
  // Create slowly rolling horizontal scanlines
  float scanline = sin((uv.y + u_time * SCANLINE_SPEED) * u_resolution.y * SCANLINE_FREQ) * HALF + HALF;
  return ONE - scanline * SCANLINE_INTENSITY;
}

// Generate grayscale clouds
float generateClouds(vec2 uv) {
  // Precompute time-based phases
  float time_phase1 = u_time * CLOUD_SPEED_1;
  float time_phase2 = u_time * CLOUD_SPEED_2;
  float time_phase3 = u_time * CLOUD_SPEED_3;

  // Sample cloud positions
  vec2 cloudPos1 = uv * CLOUD_FREQ_1 + vec2(time_phase1, ZERO);
  vec2 cloudPos2 = uv * CLOUD_FREQ_2 + vec2(time_phase2, ZERO);
  vec2 cloudPos3 = uv * CLOUD_FREQ_3 + vec2(time_phase3, ZERO);

  // Generate cloud noise
  float cloud1 = fractalNoise(cloudPos1);
  float cloud2 = fractalNoise(cloudPos2);
  float cloud3 = fractalNoise(cloudPos3);
  float clouds = max(cloud1 * CLOUD_SCALE_1, max(cloud2 * CLOUD_SCALE_2, cloud3 * CLOUD_SCALE_3));
  clouds = smoothstep(CLOUD_THRESHOLD_LOW, CLOUD_THRESHOLD_HIGH, clouds);

  return clouds;
}

// ============================================================================
// MAIN SHADER
// ============================================================================

void main() {
  // Normalize fragment coordinates to [0,1] range
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // Generate sky gradient (grayscale)
  float skyColor = mix(SKY_COLOR_TOP, SKY_COLOR_BOTTOM, uv.y);

  // Generate clouds
  float clouds = generateClouds(uv);

  // Mix sky and clouds (clouds are gray, not white)
  float color = mix(skyColor, CLOUD_BRIGHTNESS, clouds * CLOUD_OPACITY);

  // Apply CRT scanlines
  color *= crtScanlines(uv);

  // Apply color inversion if enabled
  color = u_invert ? ONE - color : color;

  // Apply brightness control
  color *= BRIGHTNESS;

  // Output final grayscale color with full alpha
  gl_FragColor = vec4(vec3(color), ONE);
}