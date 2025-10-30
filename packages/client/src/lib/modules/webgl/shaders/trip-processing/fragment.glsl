precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform bool u_invert;
uniform float u_seed1;
uniform float u_seed2;

// Configuration
#define PI 3.14159265359
#define INWARD_SPEED 2.0
#define MAX_SPEED_MULTIPLIER 6.0
#define ROTATION_SPEED 1.5

// Deterministic hash functions for per-trip randomization
float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

// Optimized noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Generate vibrant, high-contrast color palette from seeds
vec3 getPaletteColor1(float seed1, float seed2) {
    // First color from seed1 - highly saturated
    float hue1 = seed1 * 6.28;
    vec3 color = vec3(
        sin(hue1),
        sin(hue1 + 2.09),
        sin(hue1 + 4.18)
    );
    // Boost saturation and brightness
    color = abs(color); // Make all positive
    float maxComponent = max(max(color.r, color.g), color.b);
    color = color / maxComponent; // Normalize to brightest component
    return color;
}

vec3 getPaletteColor2(float seed1, float seed2) {
    // Second color from seed2 - offset by 120 degrees for contrast
    float hue2 = seed2 * 6.28 + 2.09; // +120 degrees
    vec3 color = vec3(
        sin(hue2),
        sin(hue2 + 2.09),
        sin(hue2 + 4.18)
    );
    color = abs(color);
    float maxComponent = max(max(color.r, color.g), color.b);
    color = color / maxComponent;
    return color;
}

vec3 getPaletteColor3(float seed1, float seed2) {
    // Third color - offset by 240 degrees for maximum contrast
    float hue3 = fract(seed1 + seed2) * 6.28 + 4.18; // +240 degrees
    vec3 color = vec3(
        sin(hue3),
        sin(hue3 + 2.09),
        sin(hue3 + 4.18)
    );
    color = abs(color);
    float maxComponent = max(max(color.r, color.g), color.b);
    color = color / maxComponent;
    return color;
}

void main() {
    // Normalize coordinates to -1 to 1
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);

    // Time-based acceleration (speeds up over 10 seconds)
    float timeFactor = min(u_time / 10.0, 1.0);
    float speedMultiplier = 1.0 + timeFactor * (MAX_SPEED_MULTIPLIER - 1.0);
    float complexityFactor = timeFactor;

    // Convert to polar coordinates
    float radius = length(uv);
    float angle = atan(uv.y, uv.x);

    // Prevent singularity at center
    radius = max(radius, 0.001);

    // Strong inward vortex motion
    float logRadius = log(radius);
    float spiralTime = u_time * INWARD_SPEED * speedMultiplier;

    // Create rotating coordinate system - rotation speed varies by seed for unique feel
    float rotationSpeed = ROTATION_SPEED * (0.7 + u_seed1 * 0.6); // 70%-130% of base speed
    float rotation = logRadius * rotationSpeed + spiralTime;
    float cosRot = cos(rotation);
    float sinRot = sin(rotation);
    vec2 rotatedUV = vec2(
        uv.x * cosRot - uv.y * sinRot,
        uv.x * sinRot + uv.y * cosRot
    );

    // Derive seed-based parameters for wild pattern variation
    float seed1Freq = 3.0 + u_seed1 * 15.0; // Range: 3-18
    float seed2Freq = 4.0 + u_seed2 * 20.0; // Range: 4-24
    float seedOffset1 = u_seed1 * 100.0;
    float seedOffset2 = u_seed2 * 100.0;
    float combinedSeed = fract(u_seed1 * 7.0 + u_seed2 * 13.0);

    // Chaos intensity increases exponentially after 10 seconds
    float chaosIntensity = complexityFactor * complexityFactor * complexityFactor;

    // Compound coordinate warping - gets INSANE over time
    vec2 warpedUV = rotatedUV;

    // First warp layer - seed-based turbulence
    float warp1 = noise(rotatedUV * (2.0 + combinedSeed * 4.0) + vec2(spiralTime * 0.3)) * chaosIntensity * 0.5;
    warpedUV += vec2(warp1, -warp1) * (1.0 + chaosIntensity * 3.0);

    // Second warp layer - creates feedback-like distortion
    float warp2 = noise(warpedUV * (3.0 + u_seed2 * 5.0) - vec2(spiralTime * 0.5)) * chaosIntensity;
    warpedUV += vec2(sin(warp2 * 6.28), cos(warp2 * 6.28)) * (0.5 + chaosIntensity * 2.0);

    // Third warp layer - extreme chaos at high complexity
    if (complexityFactor > 0.7) {
        float warp3 = noise(warpedUV * (10.0 + seedOffset1 * 0.1)) * (complexityFactor - 0.7) * 3.33;
        warpedUV += vec2(cos(warp3 * 12.0), sin(warp3 * 9.0)) * 1.5;
    }

    // Multiple competing pattern layers
    float pattern = 0.0;

    // Layer 1: Hyper-frequency rotating bands
    float angularPattern1 = sin(warpedUV.x * seed1Freq + seedOffset1) + cos(warpedUV.y * seed1Freq + seedOffset1);
    float bands = (angularPattern1 + logRadius * (1.0 + u_seed1 * 8.0)) * 0.5 + 0.5;
    bands = sin(bands * (2.0 + u_seed1 * 5.0 + chaosIntensity * 8.0)) * 0.5 + 0.5;
    pattern += bands * (0.25 + chaosIntensity * 0.15);

    // Layer 2: Wildly varying radial rings
    float ringFreq = (4.0 + u_seed2 * 12.0) * (1.0 + chaosIntensity * 3.0);
    float rings = sin(logRadius * ringFreq - spiralTime * (1.0 + chaosIntensity * 2.0) + seedOffset2);
    rings = rings * 0.5 + 0.5;
    pattern += rings * (0.25 + chaosIntensity * 0.15);

    // Layer 3: Interfering angular segments (increases to extreme frequencies)
    float segmentFreq = (5.0 + combinedSeed * 15.0) * (1.0 + chaosIntensity * 8.0);
    float phaseOffset = combinedSeed * 6.28 + spiralTime * (1.0 + chaosIntensity * 3.0);
    float angularPattern2 = sin(warpedUV.x * segmentFreq + phaseOffset) * cos(warpedUV.y * segmentFreq - phaseOffset);
    pattern += (angularPattern2 * 0.5 + 0.5) * (0.2 + chaosIntensity * 0.2);

    // Layer 4: Multi-scale noise interference
    vec2 noiseCoord1 = warpedUV * (2.0 + u_seed1 * 4.0) + vec2(spiralTime * 0.4, seedOffset1 * 0.1);
    float noisePattern1 = noise(noiseCoord1 * (2.0 + chaosIntensity * 6.0));
    pattern += noisePattern1 * (0.3 + chaosIntensity * 0.3);

    // Layer 5: High-frequency noise chaos
    vec2 noiseCoord2 = warpedUV * (6.0 + u_seed2 * 8.0) - vec2(spiralTime * 0.6, seedOffset2 * 0.1);
    float noisePattern2 = noise(noiseCoord2 * (1.0 + chaosIntensity * 4.0));
    pattern += noisePattern2 * chaosIntensity * 0.4;

    // Layer 6: Extreme turbulence layer (kicks in after 60% complexity)
    if (complexityFactor > 0.6) {
        float turbulence = 0.0;
        vec2 turbCoord = warpedUV * (12.0 + combinedSeed * 20.0);
        turbulence += noise(turbCoord + vec2(spiralTime)) * 0.5;
        turbulence += noise(turbCoord * 2.3 - vec2(spiralTime * 1.4)) * 0.25;
        turbulence += noise(turbCoord * 5.1 + vec2(spiralTime * 0.8)) * 0.125;
        pattern += turbulence * (complexityFactor - 0.6) * 2.5;
    }

    // Layer 7: Complete madness layer (kicks in after 80% complexity)
    if (complexityFactor > 0.8) {
        float madness = (complexityFactor - 0.8) * 5.0;
        vec2 madCoord = warpedUV * (20.0 + seedOffset1 * 0.5) + vec2(spiralTime * 2.0, -spiralTime * 1.5);
        float mad1 = noise(madCoord);
        float mad2 = noise(madCoord * 3.7 + vec2(mad1 * 10.0)); // Feedback!
        pattern += (mad1 * mad2 + 0.5) * madness * 0.6;
    }

    // Normalize pattern
    pattern = clamp(pattern, 0.0, 1.0);

    // Increase contrast - more extreme as chaos increases
    float contrastPower = 1.5 + chaosIntensity * 1.5; // 1.5 to 3.0
    pattern = pow(pattern, contrastPower);

    // Sharper transitions at high chaos
    float smoothLow = 0.2 - chaosIntensity * 0.15;
    float smoothHigh = 0.9 + chaosIntensity * 0.1;
    pattern = smoothstep(smoothLow, smoothHigh, pattern);

    // Get fixed color palette from seeds
    vec3 paletteColor1 = getPaletteColor1(u_seed1, u_seed2);
    vec3 paletteColor2 = getPaletteColor2(u_seed1, u_seed2);
    vec3 paletteColor3 = getPaletteColor3(u_seed1, u_seed2);

    // Map pattern to include black and vibrant colors
    vec3 finalColor;
    if (pattern < 0.33) {
        // From black to color1
        finalColor = mix(vec3(0.0), paletteColor1, pattern * 3.0);
    } else if (pattern < 0.66) {
        // From color1 to color2
        finalColor = mix(paletteColor1, paletteColor2, (pattern - 0.33) * 3.0);
    } else {
        // From color2 to color3
        finalColor = mix(paletteColor2, paletteColor3, (pattern - 0.66) * 3.0);
    }

    // Add pulsing intensity - gets more aggressive with chaos
    float pulseFreq = 2.0 + chaosIntensity * 6.0; // 2 to 8 Hz
    float pulse = sin(u_time * pulseFreq + pattern * PI) * 0.5 + 0.5;
    float pulseAmount = 0.3 + chaosIntensity * 0.5; // 0.3 to 0.8
    finalColor = mix(finalColor, finalColor * (1.3 + chaosIntensity * 0.7), pulse * pulseAmount);

    // Color shifting chaos at extreme complexity
    if (chaosIntensity > 0.7) {
        float colorShift = (chaosIntensity - 0.7) * 3.33;
        finalColor.rgb = finalColor.brg * (1.0 - colorShift * 0.3) + finalColor.rgb * (colorShift * 0.3);
    }

    // Overall intensity increases dramatically with chaos
    finalColor *= 0.6 + complexityFactor * 0.6 + chaosIntensity * 0.2;

    // Invert if needed
    if (u_invert) {
        finalColor = vec3(1.0) - finalColor;
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
