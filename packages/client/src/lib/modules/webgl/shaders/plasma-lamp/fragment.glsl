precision mediump float;

// ============================================================================
// CONFIGURATION VARIABLES
// ============================================================================

// Lightning tendril parameters
#define NUM_TENDRILS 15.0          // Number of lightning bolts
#define TENDRIL_SPACING 1.2566     // Angular spacing (2*PI / NUM_TENDRILS)
#define TENDRIL_ROTATION_SPEED 1.3 // How fast tendrils rotate
#define TENDRIL_WOBBLE_SPEED 0.7   // Speed of wobble animation
#define TENDRIL_WOBBLE_AMOUNT 0.5  // Amount of angular wobble
#define TENDRIL_WIDTH 0.09         // Base width of lightning
#define TENDRIL_WIDTH_FALLOFF 0.5  // Width reduction towards edge

// Noise parameters for jagged lightning
#define NOISE_SCALE_COARSE 8.0     // Large-scale noise frequency
#define NOISE_SCALE_FINE 5.0      // Fine detail noise frequency
#define NOISE_AMOUNT_COARSE 0.8    // Large-scale noise intensity
#define NOISE_AMOUNT_FINE 1.2      // Fine detail noise intensity
#define NOISE_SPEED_COARSE 2.0     // Large-scale noise animation speed
#define NOISE_SPEED_FINE 3.0       // Fine detail noise animation speed

// Flicker effect
#define FLICKER_SPEED 10.0         // Flicker animation speed
#define FLICKER_AMOUNT 0.0         // Flicker intensity (0-1)
#define FLICKER_BASE 1.0           // Minimum brightness during flicker

// Distance falloff
#define INNER_FADE_END 0.1         // Where inner fade ends
#define OUTER_FADE_START 0.6       // Where outer fade begins
#define OUTER_FADE_END 0.2         // Where outer fade ends

// Color configuration (purple/pink plasma)
#define COLOR_LIGHTNING vec3(0.8, 0.3, 1.0)
#define COLOR_PULSE vec3(0.2, 0.0, 0.3)
#define COLOR_PULSE_SPEED 5.0
#define COLOR_PULSE_DIST_SCALE 10.0

// Glow parameters
#define GLOW_CENTER_RADIUS 0.3     // Central glow size
#define GLOW_CENTER_COLOR vec3(0.3, 0.1, 0.4)
#define GLOW_AMBIENT_COLOR vec3(0.06, 0.02, 0.08)

// Animation speed
#define TIME_SCALE 0.5             // Overall animation speed

// Math constants
#define PI 3.14159
#define TWO_PI 6.28318

// Hash constants
#define HASH_V vec2(12.9898, 78.233)
#define HASH_C 43758.5453

// ============================================================================
// UNIFORMS
// ============================================================================

uniform float u_time;
uniform vec2 u_resolution;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Optimized value noise - inlined hash
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = fract(sin(dot(i, HASH_V)) * HASH_C);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), HASH_V)) * HASH_C);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), HASH_V)) * HASH_C);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), HASH_V)) * HASH_C);

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// ============================================================================
// MAIN SHADER
// ============================================================================

void main() {
  vec2 center = gl_FragCoord.xy / u_resolution - 0.5;
  float dist = length(center);
  float angle = atan(center.y, center.x);
  float time = u_time * TIME_SCALE;

  // Precompute shared values (moved outside loop)
  float distFade = smoothstep(0.0, INNER_FADE_END, dist) * smoothstep(OUTER_FADE_START, OUTER_FADE_END, dist);
  float width = TENDRIL_WIDTH * (1.0 - dist * TENDRIL_WIDTH_FALLOFF);
  float pulse = sin(time * COLOR_PULSE_SPEED + dist * COLOR_PULSE_DIST_SCALE);
  vec3 lightningColor = COLOR_LIGHTNING + COLOR_PULSE * pulse;

  // Precompute time/dist scaled values
  float timeRot = time * TENDRIL_ROTATION_SPEED;
  float timeWobble = time * TENDRIL_WOBBLE_SPEED;
  float timeFlicker = time * FLICKER_SPEED;
  float timeNoiseC = time * NOISE_SPEED_COARSE;
  float timeNoiseF = time * NOISE_SPEED_FINE;
  float distNoiseC = dist * NOISE_SCALE_COARSE;
  float distNoiseF = dist * NOISE_SCALE_FINE;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < NUM_TENDRILS; i++) {
    float tendrilAngle = i * TENDRIL_SPACING + timeRot + sin(timeWobble + i) * TENDRIL_WOBBLE_AMOUNT;

    // Angular distance to this tendril
    float angleDiff = mod(angle - tendrilAngle + PI, TWO_PI) - PI;

    // Jagged lightning using noise
    float noiseOffset = noise(vec2(distNoiseC + i * 10.0, timeNoiseC + i)) * NOISE_AMOUNT_COARSE;
    noiseOffset += noise(vec2(distNoiseF + i * 5.0, timeNoiseF)) * NOISE_AMOUNT_FINE;
    angleDiff += noiseOffset - 0.3;

    // Lightning intensity
    float lightning = smoothstep(width, 0.0, abs(angleDiff)) * distFade;

    // Flickering
    lightning *= FLICKER_BASE + FLICKER_AMOUNT * sin(timeFlicker + i * 5.0);

    col += lightning * lightningColor;
  }

  // Central glow
  col += smoothstep(GLOW_CENTER_RADIUS, 0.0, dist) * GLOW_CENTER_COLOR;

  // Outer ambient glow
  col += smoothstep(0.7, 0.2, dist) * GLOW_AMBIENT_COLOR;

  gl_FragColor = vec4(col, 1.0);
}