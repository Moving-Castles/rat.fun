precision mediump float;

// ============================================================================
// CONFIGURATION VARIABLES
// ============================================================================

// CRT effect parameters
#define SCANLINE_INTENSITY 0.1            // Intensity of horizontal scanlines
#define SCANLINE_SPEED 0.015              // Speed of scanline animation
#define CHROMATIC_ABERRATION 0.0002       // Amount of chromatic aberration
#define CHROMATIC_ABERRATION_SCALED 0.02  // Pre-scaled aberration value

// Sky gradient colors
#define SKY_COLOR_TOP_R 1.0        // Top sky color - Red component
#define SKY_COLOR_TOP_G 0.2        // Top sky color - Green component  
#define SKY_COLOR_TOP_B 0.5        // Top sky color - Blue component
#define SKY_COLOR_BOTTOM_R 0.6     // Bottom sky color - Red component
#define SKY_COLOR_BOTTOM_G 0.6     // Bottom sky color - Green component
#define SKY_COLOR_BOTTOM_B 0.6     // Bottom sky color - Blue component

// Cloud layer scaling factors
#define CLOUD_SCALE_1 1.0          // Primary cloud layer scale
#define CLOUD_SCALE_2 0.7          // Secondary cloud layer scale
#define CLOUD_SCALE_3 0.5          // Tertiary cloud layer scale

// Cloud animation parameters
#define CLOUD_SPEED_1 0.2          // Primary cloud layer animation speed
#define CLOUD_SPEED_2 0.1          // Secondary cloud layer animation speed
#define CLOUD_SPEED_3 0.35         // Tertiary cloud layer animation speed

// Cloud generation parameters
#define CLOUD_FREQ_1 3.0           // Primary cloud layer frequency
#define CLOUD_FREQ_2 5.0           // Secondary cloud layer frequency
#define CLOUD_FREQ_3 2.0           // Tertiary cloud layer frequency

// Cloud appearance parameters
#define CLOUD_THRESHOLD_LOW 0.4    // Lower threshold for cloud visibility
#define CLOUD_THRESHOLD_HIGH 0.6   // Upper threshold for cloud visibility
#define CLOUD_OPACITY 0.9          // Cloud opacity multiplier
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
#define BRIGHTNESS 1.0             // Overall brightness multiplier (0.0 = black, 1.0 = normal, >1.0 = brighter)

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

// Apply chromatic aberration and generate clouds for each color channel
vec3 crtChromaticAberration(vec2 uv, vec3 color) {
  // Apply chromatic aberration by sampling different UV offsets for each color channel
  float aberration = CHROMATIC_ABERRATION_SCALED;
  
  // Calculate center offset once and reuse
  lowp vec2 centerOffset = normalize(uv - HALF);
  lowp vec2 offsetR = centerOffset * aberration;
  lowp vec2 offsetB = centerOffset * aberration;
  
  // Use UV coordinates directly without curvature
  lowp vec2 uvR = clamp(uv + offsetR, ZERO, ONE);
  lowp vec2 uvG = uv;
  lowp vec2 uvB = clamp(uv - offsetB, ZERO, ONE);
  
  // Precompute time-based phases to avoid redundant multiplications
  float time_phase1 = u_time * CLOUD_SPEED_1;
  float time_phase2 = u_time * CLOUD_SPEED_2;
  float time_phase3 = u_time * CLOUD_SPEED_3;
  
  // Sample cloud positions at different UV positions for each channel
  vec2 cloudPos1R = uvR * CLOUD_FREQ_1 + vec2(time_phase1, ZERO);
  vec2 cloudPos2R = uvR * CLOUD_FREQ_2 + vec2(time_phase2, ZERO);
  vec2 cloudPos3R = uvR * CLOUD_FREQ_3 + vec2(time_phase3, ZERO);
  
  vec2 cloudPos1G = uvG * CLOUD_FREQ_1 + vec2(time_phase1, ZERO);
  vec2 cloudPos2G = uvG * CLOUD_FREQ_2 + vec2(time_phase2, ZERO);
  vec2 cloudPos3G = uvG * CLOUD_FREQ_3 + vec2(time_phase3, ZERO);
  
  vec2 cloudPos1B = uvB * CLOUD_FREQ_1 + vec2(time_phase1, ZERO);
  vec2 cloudPos2B = uvB * CLOUD_FREQ_2 + vec2(time_phase2, ZERO);
  vec2 cloudPos3B = uvB * CLOUD_FREQ_3 + vec2(time_phase3, ZERO);
  
  // Generate cloud noise for red channel
  float cloud1R = fractalNoise(cloudPos1R);
  float cloud2R = fractalNoise(cloudPos2R);
  float cloud3R = fractalNoise(cloudPos3R);
  float cloudsR = max(cloud1R * CLOUD_SCALE_1, max(cloud2R * CLOUD_SCALE_2, cloud3R * CLOUD_SCALE_3));
  cloudsR = smoothstep(CLOUD_THRESHOLD_LOW, CLOUD_THRESHOLD_HIGH, cloudsR);
  
  // Generate cloud noise for green channel
  float cloud1G = fractalNoise(cloudPos1G);
  float cloud2G = fractalNoise(cloudPos2G);
  float cloud3G = fractalNoise(cloudPos3G);
  float cloudsG = max(cloud1G * CLOUD_SCALE_1, max(cloud2G * CLOUD_SCALE_2, cloud3G * CLOUD_SCALE_3));
  cloudsG = smoothstep(CLOUD_THRESHOLD_LOW, CLOUD_THRESHOLD_HIGH, cloudsG);
  
  // Generate cloud noise for blue channel
  float cloud1B = fractalNoise(cloudPos1B);
  float cloud2B = fractalNoise(cloudPos2B);
  float cloud3B = fractalNoise(cloudPos3B);
  float cloudsB = max(cloud1B * CLOUD_SCALE_1, max(cloud2B * CLOUD_SCALE_2, cloud3B * CLOUD_SCALE_3));
  cloudsB = smoothstep(CLOUD_THRESHOLD_LOW, CLOUD_THRESHOLD_HIGH, cloudsB);
  
  // Precompute sky color vectors to avoid redundant vec3 constructions
  vec3 skyColorTop = vec3(SKY_COLOR_TOP_R, SKY_COLOR_TOP_G, SKY_COLOR_TOP_B);
  vec3 skyColorBottom = vec3(SKY_COLOR_BOTTOM_R, SKY_COLOR_BOTTOM_G, SKY_COLOR_BOTTOM_B);
  
  // Sample sky colors for each channel using pre-calculated constants
  vec3 skyColorR = mix(skyColorTop, skyColorBottom, uvR.y);
  vec3 skyColorG = mix(skyColorTop, skyColorBottom, uvG.y);
  vec3 skyColorB = mix(skyColorTop, skyColorBottom, uvB.y);
  
  // Mix sky and clouds for each channel
  float r = mix(skyColorR.r, ONE, cloudsR * CLOUD_OPACITY);
  float g = mix(skyColorG.g, ONE, cloudsG * CLOUD_OPACITY);
  float b = mix(skyColorB.b, ONE, cloudsB * CLOUD_OPACITY);
  
  return vec3(r, g, b);
}

// ============================================================================
// MAIN SHADER
// ============================================================================

void main() {
  // Normalize fragment coordinates to [0,1] range
  vec2 uv = gl_FragCoord.xy / u_resolution;
  
  // Apply CRT effects with chromatic aberration (which now handles all the cloud generation)
  vec3 color = crtChromaticAberration(uv, vec3(ZERO));
  
  // Apply remaining CRT effects
  color *= crtScanlines(uv);
  
  // Apply color inversion if enabled (optimized: use conditional assignment)
  color = u_invert ? vec3(ONE) - color : color;
  
  // Apply brightness control
  color *= BRIGHTNESS;
  
  // Output final color with full alpha
  gl_FragColor = vec4(color, ONE);
} 