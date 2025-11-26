precision mediump float;

// ============================================================================
// CONFIGURATION VARIABLES
// ============================================================================

// Star field parameters
#define STAR_LAYERS 1.0            // Number of star layers (depth)
#define SPEED_BASE 0.8             // Base animation speed
#define SPEED_LAYER_MULT 0.5       // Speed increase per layer
#define SCALE_BASE 15.0            // Base grid scale for stars
#define SCALE_LAYER_MULT 10.0      // Scale increase per layer
#define Z_CYCLE_SPEED 0.3          // How fast stars cycle through depth

// Star appearance
#define STAR_SIZE 0.02             // Base star size
#define STREAK_SIZE 0.1            // Size of star streak/trail
#define STREAK_INTENSITY 0.3       // Brightness of streak effect
#define CELL_OFFSET_RANGE 0.8      // Random position range within cell

// Color configuration (dark golden)
#define COLOR_BASE vec3(0.55, 0.25, 0.2)
#define COLOR_DEPTH vec3(0.3, 0.2, 0.05)
#define COLOR_DEPTH_BLEND 0.3      // How much depth affects color

// Vignette
#define VIGNETTE_STRENGTH 0.5      // Edge darkening intensity

// Precomputed constants
#define HASH_V vec2(127.1, 311.7)
#define HASH_C 43758.5453

// ============================================================================
// UNIFORMS
// ============================================================================

uniform float u_time;
uniform vec2 u_resolution;

// ============================================================================
// MAIN SHADER
// ============================================================================

void main() {
  vec2 center = gl_FragCoord.xy / u_resolution - 0.5;
  float time = u_time * SPEED_BASE;
  vec3 col = vec3(0.0);

  // Unrolled loop for 3 layers - eliminates loop overhead
  float layerScale, z, zFade, persp, d, star, zBlend;
  vec2 cellUV, cellID, cellPos, starOffset, sp;

  // Layer 0
  layerScale = SCALE_BASE;
  cellUV = center * layerScale;
  cellID = floor(cellUV);
  cellPos = fract(cellUV) - 0.5;
  starOffset = vec2(
    fract(sin(dot(cellID * 1.3, HASH_V)) * HASH_C),
    fract(sin(dot(cellID * 2.7, HASH_V)) * HASH_C)
  ) - 0.5;
  z = fract(fract(sin(dot(cellID, HASH_V)) * HASH_C) - time * Z_CYCLE_SPEED);
  zFade = smoothstep(0.0, 0.1, z) * smoothstep(1.0, 0.3, z);
  persp = 1.0 / (z * 2.0 + 0.1);
  sp = (cellPos - starOffset * CELL_OFFSET_RANGE) * persp * 0.1;
  d = length(sp);
  star = smoothstep(STAR_SIZE * persp, 0.0, d) + smoothstep(STREAK_SIZE * persp, 0.0, d) * STREAK_INTENSITY * 0.5;
  zBlend = 0.7 + z * COLOR_DEPTH_BLEND;
  col += star * zFade * (COLOR_BASE * zBlend + COLOR_DEPTH * (1.0 - z));

  // Layer 1
  layerScale = SCALE_BASE + SCALE_LAYER_MULT;
  cellUV = center * layerScale;
  cellID = floor(cellUV);
  cellPos = fract(cellUV) - 0.5;
  starOffset = vec2(
    fract(sin(dot(cellID * 1.3 + 1.0, HASH_V)) * HASH_C),
    fract(sin(dot(cellID * 2.7 + 1.0, HASH_V)) * HASH_C)
  ) - 0.5;
  z = fract(fract(sin(dot(cellID + 100.0, HASH_V)) * HASH_C) - time * Z_CYCLE_SPEED * (1.0 + SPEED_LAYER_MULT));
  zFade = smoothstep(0.0, 0.1, z) * smoothstep(1.0, 0.3, z);
  persp = 1.0 / (z * 2.0 + 0.1);
  sp = (cellPos - starOffset * CELL_OFFSET_RANGE) * persp * 0.1;
  d = length(sp);
  star = smoothstep(STAR_SIZE * persp, 0.0, d) + smoothstep(STREAK_SIZE * persp, 0.0, d) * STREAK_INTENSITY * 0.5;
  zBlend = 0.7 + z * COLOR_DEPTH_BLEND;
  col += star * zFade * (COLOR_BASE * zBlend + COLOR_DEPTH * (1.0 - z));

  // Layer 2
  layerScale = SCALE_BASE + SCALE_LAYER_MULT * 2.0;
  cellUV = center * layerScale;
  cellID = floor(cellUV);
  cellPos = fract(cellUV) - 0.5;
  starOffset = vec2(
    fract(sin(dot(cellID * 1.3 + 2.0, HASH_V)) * HASH_C),
    fract(sin(dot(cellID * 2.7 + 2.0, HASH_V)) * HASH_C)
  ) - 0.5;
  z = fract(fract(sin(dot(cellID + 200.0, HASH_V)) * HASH_C) - time * Z_CYCLE_SPEED * (1.0 + SPEED_LAYER_MULT * 2.0));
  zFade = smoothstep(0.0, 0.1, z) * smoothstep(1.0, 0.3, z);
  persp = 1.0 / (z * 2.0 + 0.1);
  sp = (cellPos - starOffset * CELL_OFFSET_RANGE) * persp * 0.1;
  d = length(sp);
  star = smoothstep(STAR_SIZE * persp, 0.0, d) + smoothstep(STREAK_SIZE * persp, 0.0, d) * STREAK_INTENSITY * 0.5;
  zBlend = 0.7 + z * COLOR_DEPTH_BLEND;
  col += star * zFade * (COLOR_BASE * zBlend + COLOR_DEPTH * (1.0 - z));

  // Vignette
  col *= 1.0 - length(center) * VIGNETTE_STRENGTH;

  gl_FragColor = vec4(col, 1.0);
}