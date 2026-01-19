precision highp float;

// ============================================================================
// CONFIGURATION VARIABLES
// ============================================================================

// Motion parameters
#define INWARD_SPEED 2.0                // Base speed of inward vortex motion
#define MAX_SPEED_MULTIPLIER 6.0        // Maximum speed multiplier at peak
#define ROTATION_SPEED 1.5              // Base rotation speed for spiral
#define ROTATION_SEED_MIN 0.7           // Minimum rotation multiplier (70%)
#define ROTATION_SEED_RANGE 0.6         // Range for rotation variation (70%-130%)

// Seed-based frequency ranges
#define SEED1_FREQ_BASE 3.0             // Base frequency for seed1 patterns
#define SEED1_FREQ_RANGE 15.0           // Frequency range (3-18)
#define SEED2_FREQ_BASE 4.0             // Base frequency for seed2 patterns
#define SEED2_FREQ_RANGE 20.0           // Frequency range (4-24)
#define SEED_OFFSET_SCALE 100.0         // Scale for phase offsets

// Noise characteristic ranges
#define SMOOTHNESS_BASE 0.5             // Base smoothness value
#define SMOOTHNESS_RANGE 1.0            // Smoothness range (0.5-1.5)
#define TILE_SIZE1_BASE 5.0             // Base tile size for seed1
#define TILE_SIZE1_RANGE 15.0           // Tile size range (5-20)
#define TILE_SIZE2_BASE 4.0             // Base tile size for seed2
#define TILE_SIZE2_RANGE 12.0           // Tile size range (4-16)

// Pattern layer weights
#define LAYER_BASE_WEIGHT 0.25          // Base weight for pattern layers
#define LAYER_CHAOS_WEIGHT 0.15         // Additional weight from chaos
#define LAYER3_BASE_WEIGHT 0.2          // Layer 3 specific base weight
#define LAYER3_CHAOS_WEIGHT 0.2         // Layer 3 chaos weight
#define LAYER4_BASE_WEIGHT 0.3          // Layer 4 base weight
#define LAYER4_CHAOS_WEIGHT 0.3         // Layer 4 chaos weight
#define LAYER5_CHAOS_WEIGHT 0.4         // Layer 5 chaos weight multiplier

// Warp effect multipliers
#define WARP1_CHAOS_SCALE 0.5           // Warp1 chaos intensity scale
#define WARP1_STRENGTH_BASE 1.0         // Warp1 base strength
#define WARP1_STRENGTH_CHAOS 3.0        // Warp1 chaos multiplier
#define WARP2_STRENGTH_BASE 0.5         // Warp2 base strength
#define WARP2_STRENGTH_CHAOS 2.0        // Warp2 chaos multiplier
#define WARP3_THRESHOLD 0.7             // Complexity threshold for warp3
#define WARP3_MULTIPLIER 3.33           // Warp3 intensity multiplier
#define WARP3_STRENGTH 1.5              // Warp3 displacement strength

// LOD time thresholds (must match complexity thresholds to avoid negative amplitude)
// complexityFactor = u_time / 10.0, so threshold 0.6 = 6 seconds
#define LOD_TIME_TURB 6.0               // Enable turbulence at t=6s (complexity=0.6)
#define LOD_TIME_WARP3 7.0              // Enable warp3 at t=7s (complexity=0.7)
#define LOD_TIME_MADNESS 8.0            // Enable madness at t=8s (complexity=0.8)

// Turbulence parameters
#define TURB_THRESHOLD 0.6              // Complexity threshold for turbulence
#define TURB_MULTIPLIER 2.5             // Turbulence pattern multiplier
#define TURB_OCTAVE1_WEIGHT 0.5         // First octave weight
#define TURB_OCTAVE2_WEIGHT 0.25        // Second octave weight
#define TURB_OCTAVE3_WEIGHT 0.125       // Third octave weight
#define TURB_OCTAVE2_FREQ 2.3           // Second octave frequency
#define TURB_OCTAVE3_FREQ 5.1           // Third octave frequency

// Madness layer parameters
#define MAD_THRESHOLD 0.8               // Complexity threshold for madness
#define MAD_MULTIPLIER 5.0              // Madness intensity multiplier
#define MAD_FEEDBACK_FREQ 3.7           // Feedback frequency multiplier
#define MAD_FEEDBACK_SCALE 10.0         // Feedback displacement scale
#define MAD_PATTERN_WEIGHT 0.6          // Madness pattern weight

// Contrast and color parameters
#define CONTRAST_BASE 1.5               // Base contrast power
#define CONTRAST_CHAOS_RANGE 1.5        // Contrast chaos range (1.5-3.0)
#define SMOOTH_LOW_BASE 0.2             // Base smoothstep lower bound
#define SMOOTH_LOW_CHAOS_OFFSET 0.15    // Chaos offset for lower bound
#define SMOOTH_HIGH_BASE 0.9            // Base smoothstep upper bound
#define SMOOTH_HIGH_CHAOS_OFFSET 0.1    // Chaos offset for upper bound
#define COLOR_THRESHOLD_1 0.33          // First color transition threshold
#define COLOR_THRESHOLD_2 0.66          // Second color transition threshold
#define COLOR_SCALE 3.0                 // Color interpolation scale

// Pulse parameters
#define PULSE_FREQ_BASE 2.0             // Base pulse frequency
#define PULSE_FREQ_CHAOS 6.0            // Chaos pulse frequency range (2-8 Hz)
#define PULSE_AMOUNT_BASE 0.3           // Base pulse amount
#define PULSE_AMOUNT_CHAOS 0.5          // Chaos pulse amount range (0.3-0.8)
#define PULSE_BRIGHTNESS_BASE 1.3       // Base brightness multiplier
#define PULSE_BRIGHTNESS_CHAOS 0.7      // Chaos brightness range

// Color shift parameters
#define COLOR_SHIFT_THRESHOLD 0.7       // Complexity threshold for color shift
#define COLOR_SHIFT_MULTIPLIER 3.33     // Color shift intensity multiplier
#define COLOR_SHIFT_MIX 0.3             // Color channel mix amount

// Intensity parameters
#define INTENSITY_BASE 0.6              // Base intensity
#define INTENSITY_COMPLEXITY 0.6        // Complexity intensity contribution
#define INTENSITY_CHAOS 0.2             // Chaos intensity contribution

// Hash function constants
#define HASH_MULTIPLIER1 0.1031         // Hash multiplier 1
#define HASH_MULTIPLIER2 0.1030         // Hash multiplier 2
#define HASH_MULTIPLIER3 0.0973         // Hash multiplier 3
#define HASH_OFFSET 33.33               // Hash offset value

// Mathematical constants
#define PI 3.14159265359                // Pi constant
#define TWO_PI 6.28318530718            // 2 * Pi
#define HALF 0.5                        // 0.5 constant
#define ONE 1.0                         // 1.0 constant
#define TWO 2.0                         // 2.0 constant
#define THREE 3.0                       // 3.0 constant
#define ZERO 0.0                        // 0.0 constant
#define EPSILON 0.001                   // Small value to prevent singularities

// Noise mode thresholds
#define NOISE_MODE1_THRESHOLD 0.5       // Threshold for rotated noise mode
#define NOISE_MODE2_RIDGED 0.66         // Threshold for ridged noise mode
#define NOISE_MODE2_CELLULAR 0.33       // Threshold for cellular noise mode

// Seed mixing constants
#define SEED_MIX1 7.0                   // First seed mixing value
#define SEED_MIX2 13.0                  // Second seed mixing value
#define NOISE_MODE1_SEED 3.7            // Seed multiplier for noise mode 1
#define NOISE_MODE2_SEED 5.3            // Seed multiplier for noise mode 2

// ============================================================================
// UNIFORMS
// ============================================================================

uniform float u_time;                   // Current time in seconds
uniform vec2 u_resolution;              // Screen resolution (width, height)
uniform bool u_invert;                  // Color inversion toggle
uniform float u_seed1;                  // First seed value (0-1)
uniform float u_seed2;                  // Second seed value (0-1)
uniform float u_quality;                // Quality tier (0.0=mobile, 1.0=desktop)

// ============================================================================
// HASH FUNCTIONS
// ============================================================================

// Hash function - single float to single float
float hash11(float p) {
    p = fract(p * HASH_MULTIPLIER1);
    p *= p + HASH_OFFSET;
    p *= p + p;
    return fract(p);
}

// Hash function - vec2 to single float
float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * HASH_MULTIPLIER1);
    p3 += dot(p3, p3.yzx + HASH_OFFSET);
    return fract((p3.x + p3.y) * p3.z);
}

// Hash function - vec2 to vec2
vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(HASH_MULTIPLIER1, HASH_MULTIPLIER2, HASH_MULTIPLIER3));
    p3 += dot(p3, p3.yzx + HASH_OFFSET);
    return fract((p3.xx + p3.yz) * p3.zy);
}

// ============================================================================
// NOISE FUNCTIONS
// ============================================================================

// Basic noise function with variable interpolation smoothness
float noise(vec2 p, float smoothness) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // Variable smoothness - changes the character of the noise
    f = f * f * (THREE - TWO * f * smoothness);

    // Sample noise at four corners of the grid cell
    float a = hash12(i);
    float b = hash12(i + vec2(ONE, ZERO));
    float c = hash12(i + vec2(ZERO, ONE));
    float d = hash12(i + vec2(ONE, ONE));

    // Bilinear interpolation
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Rotated noise - fundamentally different grid alignment per seed
float rotatedNoise(vec2 p, float angle, float smoothness) {
    float c = cos(angle);
    float s = sin(angle);
    mat2 rot = mat2(c, -s, s, c);
    return noise(rot * p, smoothness);
}

// Domain-repeated noise - creates different tiling patterns
float tiledNoise(vec2 p, float tileSize, float smoothness) {
    return noise(mod(p, tileSize), smoothness);
}

// Ridged noise - creates sharp peaks (more geometric feel)
float ridgedNoise(vec2 p, float smoothness) {
    return ONE - abs(noise(p, smoothness) * TWO - ONE);
}

// Cellular/worley-like noise approximation
float cellularNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float minDist = ONE;

    // Check neighboring cells (3x3 grid)
    for(int x = -1; x <= 1; x++) {
        for(int y = -1; y <= 1; y++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash22(i + neighbor);
            vec2 diff = neighbor + point - f;
            minDist = min(minDist, length(diff));
        }
    }

    return minDist;
}

// ============================================================================
// COLOR PALETTE FUNCTIONS
// ============================================================================

// Generate vibrant, high-contrast color from hue
vec3 generatePaletteColor(float hue) {
    vec3 color = vec3(
        sin(hue),
        sin(hue + 2.09),
        sin(hue + 4.18)
    );

    // Make all components positive and normalize to brightest
    color = abs(color);
    float maxComponent = max(max(color.r, color.g), color.b);
    return color / maxComponent;
}

// First palette color from seed1
vec3 getPaletteColor1(float seed1, float seed2) {
    return generatePaletteColor(seed1 * TWO_PI);
}

// Second palette color from seed2 - offset by 120 degrees for contrast
vec3 getPaletteColor2(float seed1, float seed2) {
    return generatePaletteColor(seed2 * TWO_PI + 2.09);
}

// Third palette color - offset by 240 degrees for maximum contrast
vec3 getPaletteColor3(float seed1, float seed2) {
    return generatePaletteColor(fract(seed1 + seed2) * TWO_PI + 4.18);
}

// ============================================================================
// MAIN SHADER
// ============================================================================

void main() {
    // Normalize coordinates to [-1, 1] range
    vec2 uv = (gl_FragCoord.xy * TWO - u_resolution) / min(u_resolution.x, u_resolution.y);

    // Time-based factors (pre-compute to avoid redundant calculations)
    const float invMaxTime = ONE / 10.0;
    float timeFactor = min(u_time * invMaxTime, ONE);
    float speedMultiplier = ONE + timeFactor * (MAX_SPEED_MULTIPLIER - ONE);
    float complexityFactor = timeFactor;
    float chaosIntensity = complexityFactor * complexityFactor * complexityFactor;

    // Convert to polar coordinates
    float radius = max(length(uv), EPSILON); // Prevent singularity at center
    float logRadius = log(radius);

    // Spiral motion parameters
    float spiralTime = u_time * INWARD_SPEED * speedMultiplier;
    float rotationSpeed = ROTATION_SPEED * (ROTATION_SEED_MIN + u_seed1 * ROTATION_SEED_RANGE);
    float rotation = logRadius * rotationSpeed + spiralTime;

    // Create rotating coordinate system (single calculation)
    float cosRot = cos(rotation);
    float sinRot = sin(rotation);
    vec2 rotatedUV = vec2(
        uv.x * cosRot - uv.y * sinRot,
        uv.x * sinRot + uv.y * cosRot
    );

    // Pre-compute seed-based parameters (hoisted out of conditionals)
    float seed1Freq = SEED1_FREQ_BASE + u_seed1 * SEED1_FREQ_RANGE;
    float seed2Freq = SEED2_FREQ_BASE + u_seed2 * SEED2_FREQ_RANGE;
    float seedOffset1 = u_seed1 * SEED_OFFSET_SCALE;
    float seedOffset2 = u_seed2 * SEED_OFFSET_SCALE;
    float combinedSeed = fract(u_seed1 * SEED_MIX1 + u_seed2 * SEED_MIX2);

    // Noise characteristics
    float noiseRotation1 = u_seed1 * TWO_PI;
    float noiseRotation2 = u_seed2 * TWO_PI;
    float smoothness1 = SMOOTHNESS_BASE + u_seed1 * SMOOTHNESS_RANGE;
    float smoothness2 = SMOOTHNESS_BASE + u_seed2 * SMOOTHNESS_RANGE;
    float tileSize1 = TILE_SIZE1_BASE + u_seed1 * TILE_SIZE1_RANGE;
    float tileSize2 = TILE_SIZE2_BASE + u_seed2 * TILE_SIZE2_RANGE;

    // Determine noise modes (pre-compute booleans)
    bool useRotatedNoise1 = fract(u_seed1 * NOISE_MODE1_SEED) > NOISE_MODE1_THRESHOLD;
    bool useRidgedNoise = fract(u_seed2 * NOISE_MODE2_SEED) > NOISE_MODE2_RIDGED;
    bool useCellularNoise = fract(u_seed2 * NOISE_MODE2_SEED) < NOISE_MODE2_CELLULAR;

    // Coordinate warping - layer 1
    vec2 warpCoord1 = rotatedUV * (TWO + combinedSeed * 4.0) + vec2(spiralTime * 0.3);
    float warp1 = (useRotatedNoise1 ?
        rotatedNoise(warpCoord1, noiseRotation1, smoothness1) :
        tiledNoise(warpCoord1, tileSize1, smoothness1)) * chaosIntensity * WARP1_CHAOS_SCALE;

    vec2 warpedUV = rotatedUV + vec2(warp1, -warp1) * (WARP1_STRENGTH_BASE + chaosIntensity * WARP1_STRENGTH_CHAOS);

    // Coordinate warping - layer 2
    vec2 warpCoord2 = warpedUV * (THREE + u_seed2 * 5.0) - vec2(spiralTime * HALF);
    float warp2 = (useRidgedNoise ?
        ridgedNoise(warpCoord2, smoothness2) :
        (useCellularNoise ? cellularNoise(warpCoord2) : noise(warpCoord2, smoothness2))) * chaosIntensity;

    warpedUV += vec2(sin(warp2 * TWO_PI), cos(warp2 * TWO_PI)) * (WARP2_STRENGTH_BASE + chaosIntensity * WARP2_STRENGTH_CHAOS);

    // Coordinate warping - layer 3 (extreme chaos)
    // LOD: uniform-based branch allows GPU to skip entirely before 7s
    if (u_time > LOD_TIME_WARP3) {
        float warp3a = rotatedNoise(warpedUV * (10.0 + seedOffset1 * 0.1), noiseRotation2, smoothness1);
        float warp3b = ridgedNoise(warpedUV * (8.0 + seedOffset2 * 0.1), smoothness2);
        float warp3 = mix(warp3a, warp3b, combinedSeed) * (complexityFactor - WARP3_THRESHOLD) * WARP3_MULTIPLIER;
        warpedUV += vec2(cos(warp3 * 12.0), sin(warp3 * 9.0)) * WARP3_STRENGTH;
    }

    // Pattern accumulation
    float pattern = ZERO;

    // Layer 1: Hyper-frequency rotating bands
    float angularPattern1 = sin(warpedUV.x * seed1Freq + seedOffset1) + cos(warpedUV.y * seed1Freq + seedOffset1);
    float bands = (angularPattern1 + logRadius * (ONE + u_seed1 * 8.0)) * HALF + HALF;
    bands = sin(bands * (TWO + u_seed1 * 5.0 + chaosIntensity * 8.0)) * HALF + HALF;
    pattern += bands * (LAYER_BASE_WEIGHT + chaosIntensity * LAYER_CHAOS_WEIGHT);

    // Layer 2: Wildly varying radial rings
    float ringFreq = (4.0 + u_seed2 * 12.0) * (ONE + chaosIntensity * THREE);
    float rings = sin(logRadius * ringFreq - spiralTime * (ONE + chaosIntensity * TWO) + seedOffset2) * HALF + HALF;
    pattern += rings * (LAYER_BASE_WEIGHT + chaosIntensity * LAYER_CHAOS_WEIGHT);

    // Layer 3: Interfering angular segments
    float segmentFreq = (5.0 + combinedSeed * 15.0) * (ONE + chaosIntensity * 8.0);
    float phaseOffset = combinedSeed * TWO_PI + spiralTime * (ONE + chaosIntensity * THREE);
    float angularPattern2 = sin(warpedUV.x * segmentFreq + phaseOffset) * cos(warpedUV.y * segmentFreq - phaseOffset);
    pattern += (angularPattern2 * HALF + HALF) * (LAYER3_BASE_WEIGHT + chaosIntensity * LAYER3_CHAOS_WEIGHT);

    // Layer 4: Multi-scale noise interference
    vec2 noiseCoord1 = warpedUV * (TWO + u_seed1 * 4.0) + vec2(spiralTime * 0.4, seedOffset1 * 0.1);
    float noiseScale1 = TWO + chaosIntensity * 6.0;
    float noisePattern1 = useRidgedNoise ?
        ridgedNoise(noiseCoord1 * noiseScale1, smoothness1) :
        rotatedNoise(noiseCoord1 * noiseScale1, noiseRotation1, smoothness1);
    pattern += noisePattern1 * (LAYER4_BASE_WEIGHT + chaosIntensity * LAYER4_CHAOS_WEIGHT);

    // Layer 5: High-frequency noise chaos
    vec2 noiseCoord2 = warpedUV * (6.0 + u_seed2 * 8.0) - vec2(spiralTime * 0.6, seedOffset2 * 0.1);
    float noiseScale2 = ONE + chaosIntensity * 4.0;
    float noisePattern2 = useCellularNoise ?
        cellularNoise(noiseCoord2 * noiseScale2) :
        tiledNoise(noiseCoord2 * noiseScale2, tileSize2, smoothness2);
    pattern += noisePattern2 * chaosIntensity * LAYER5_CHAOS_WEIGHT;

    // Layer 6: Extreme turbulence (conditional)
    // LOD: uniform-based branch allows GPU to skip entirely before 6s
    if (u_time > LOD_TIME_TURB) {
        vec2 turbCoord = warpedUV * (12.0 + combinedSeed * 20.0);
        vec2 spiralVec = vec2(spiralTime);

        float turbulence = (useRotatedNoise1 ?
            rotatedNoise(turbCoord + spiralVec, noiseRotation1, smoothness1) * TURB_OCTAVE1_WEIGHT +
            ridgedNoise(turbCoord * TURB_OCTAVE2_FREQ - spiralVec * 1.4, smoothness2) * TURB_OCTAVE2_WEIGHT :
            tiledNoise(turbCoord + spiralVec, tileSize1, smoothness1) * TURB_OCTAVE1_WEIGHT +
            noise(turbCoord * TURB_OCTAVE2_FREQ - spiralVec * 1.4, smoothness2) * TURB_OCTAVE2_WEIGHT) +
            cellularNoise(turbCoord * TURB_OCTAVE3_FREQ + spiralVec * 0.8) * TURB_OCTAVE3_WEIGHT;

        pattern += turbulence * (complexityFactor - TURB_THRESHOLD) * TURB_MULTIPLIER;
    }

    // Layer 7: Complete madness (conditional)
    // LOD: skip on mobile (u_quality < 1.0) and before 5s
    if (u_time > LOD_TIME_MADNESS && u_quality > 0.5) {
        float madness = (complexityFactor - MAD_THRESHOLD) * MAD_MULTIPLIER;
        vec2 madCoord = warpedUV * (20.0 + seedOffset1 * HALF) + vec2(spiralTime * TWO, -spiralTime * 1.5);

        float mad1, mad2;
        if (useRidgedNoise) {
            mad1 = ridgedNoise(madCoord, smoothness1);
            mad2 = cellularNoise(madCoord * MAD_FEEDBACK_FREQ + vec2(mad1 * MAD_FEEDBACK_SCALE));
        } else if (useCellularNoise) {
            mad1 = cellularNoise(madCoord);
            mad2 = rotatedNoise(madCoord * MAD_FEEDBACK_FREQ + vec2(mad1 * MAD_FEEDBACK_SCALE), noiseRotation2, smoothness2);
        } else {
            mad1 = rotatedNoise(madCoord, noiseRotation1, smoothness1);
            mad2 = ridgedNoise(madCoord * MAD_FEEDBACK_FREQ + vec2(mad1 * MAD_FEEDBACK_SCALE), smoothness2);
        }

        pattern += (mad1 * mad2 + HALF) * madness * MAD_PATTERN_WEIGHT;
    }

    // Normalize and apply contrast
    pattern = clamp(pattern, ZERO, ONE);
    pattern = pow(pattern, CONTRAST_BASE + chaosIntensity * CONTRAST_CHAOS_RANGE);
    pattern = smoothstep(
        SMOOTH_LOW_BASE - chaosIntensity * SMOOTH_LOW_CHAOS_OFFSET,
        SMOOTH_HIGH_BASE + chaosIntensity * SMOOTH_HIGH_CHAOS_OFFSET,
        pattern
    );

    // Get color palette (pre-compute outside of conditional)
    vec3 paletteColor1 = getPaletteColor1(u_seed1, u_seed2);
    vec3 paletteColor2 = getPaletteColor2(u_seed1, u_seed2);
    vec3 paletteColor3 = getPaletteColor3(u_seed1, u_seed2);

    // Map pattern to colors
    vec3 finalColor;
    if (pattern < COLOR_THRESHOLD_1) {
        finalColor = mix(vec3(ZERO), paletteColor1, pattern * COLOR_SCALE);
    } else if (pattern < COLOR_THRESHOLD_2) {
        finalColor = mix(paletteColor1, paletteColor2, (pattern - COLOR_THRESHOLD_1) * COLOR_SCALE);
    } else {
        finalColor = mix(paletteColor2, paletteColor3, (pattern - COLOR_THRESHOLD_2) * COLOR_SCALE);
    }

    // Add pulsing intensity
    float pulseFreq = PULSE_FREQ_BASE + chaosIntensity * PULSE_FREQ_CHAOS;
    float pulse = sin(u_time * pulseFreq + pattern * PI) * HALF + HALF;
    float pulseAmount = PULSE_AMOUNT_BASE + chaosIntensity * PULSE_AMOUNT_CHAOS;
    finalColor = mix(finalColor, finalColor * (PULSE_BRIGHTNESS_BASE + chaosIntensity * PULSE_BRIGHTNESS_CHAOS), pulse * pulseAmount);

    // Color shifting chaos at extreme complexity
    if (chaosIntensity > COLOR_SHIFT_THRESHOLD) {
        float colorShift = (chaosIntensity - COLOR_SHIFT_THRESHOLD) * COLOR_SHIFT_MULTIPLIER;
        finalColor.rgb = finalColor.brg * (ONE - colorShift * COLOR_SHIFT_MIX) + finalColor.rgb * (colorShift * COLOR_SHIFT_MIX);
    }

    // Overall intensity
    finalColor *= INTENSITY_BASE + complexityFactor * INTENSITY_COMPLEXITY + chaosIntensity * INTENSITY_CHAOS;

    // Invert if needed
    if (u_invert) {
        finalColor = vec3(ONE) - finalColor;
    }

    gl_FragColor = vec4(finalColor, ONE);
}
