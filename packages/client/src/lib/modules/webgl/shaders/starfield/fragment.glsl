precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;

// Hash function for star positions
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D hash for star coordinates
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Create a star at given position with twinkle
float star(vec2 p, float brightness, float size) {
  float d = length(p);
  float star = smoothstep(size, 0.0, d);
  star *= brightness;
  
  // Add twinkle effect
  float twinkle = 0.8 + 0.2 * sin(u_time * 3.0 + brightness * 100.0);
  star *= twinkle;
  
  return star;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  // Create background space color
  vec3 spaceColor = vec3(0.02, 0.05, 0.15);
  vec3 color = spaceColor;
  
  // Gentle drift for normal starfield
  vec2 driftUV = uv;
  driftUV += vec2(u_time * 0.02, u_time * 0.01); // Slow x,y drift
  
  // Z-axis motion effect for warpspeed
  vec2 center = vec2(0.0);
  vec2 toCenter = center - uv;
  float distFromCenter = length(toCenter);
  vec2 dirToCenter = normalize(toCenter);
  
  // Apply z-motion effect based on speed
  float zMotion = u_speed * u_time * 2.0;
  vec2 warpUV = uv + dirToCenter * zMotion * 0.3;
  
  // Mix between drift and warp motion
  vec2 finalUV = mix(driftUV, warpUV, u_speed);
  
  // Create multiple star layers - more layers for hyperwarp
  int maxLayers = u_speed > 1.5 ? 5 : 3;
  for (int layer = 0; layer < 5; layer++) {
    if (layer >= maxLayers) break;
    
    float layerDepth = float(layer + 1);
    float layerScale = 8.0 + float(layer) * 4.0;
    vec2 layerUV = finalUV * layerScale;
    
    // Each layer moves at different speed to create depth
    layerUV += vec2(u_time * (0.01 + float(layer) * 0.005));
    
    vec2 gridPos = floor(layerUV);
    vec2 cellPos = fract(layerUV) - 0.5;
    
    float starChance = hash(gridPos + vec2(float(layer) * 100.0));
    if (starChance > 0.85 - float(layer) * 0.05) {
      vec2 starOffset = hash2(gridPos + vec2(float(layer) * 50.0)) * 0.3;
      vec2 starPos = cellPos + starOffset;
      
      float brightness = 0.3 + 0.7 * hash(gridPos + vec2(float(layer) * 25.0));
      brightness *= (1.0 - float(layer) * 0.2); // Distant layers dimmer
      
      // Enhanced flickering for hyperwarp
      if (u_speed > 1.5) {
        float flicker = sin(u_time * 15.0 + brightness * 50.0) * 0.3 + 0.7;
        flicker *= sin(u_time * 8.0 + float(layer) * 3.0) * 0.2 + 0.8;
        brightness *= flicker;
      }
      
      // Star stretching effect based on speed
      vec2 stretchDir = normalize(starPos - center);
      float stretchAmount = u_speed * 0.1 * (1.0 + distFromCenter);
      
      if (u_speed > 0.01) {
        // Create light streaks instead of dots
        float baseStreakLength = u_speed * 0.2;
        float streakLength = u_speed > 1.5 ? baseStreakLength * 2.5 : baseStreakLength;
        vec2 streakStart = starPos;
        vec2 streakEnd = starPos + stretchDir * streakLength;
        
        // More sampling points for hyperwarp
        int streakSamples = u_speed > 1.5 ? 16 : 8;
        
        // Sample along the streak line
        float streakBrightness = 0.0;
        for (int i = 0; i < 16; i++) {
          if (i >= streakSamples) break;
          
          float t = float(i) / float(streakSamples - 1);
          vec2 streakPoint = mix(streakStart, streakEnd, t);
          float streakDist = length(streakPoint);
          float streakContrib = smoothstep(0.04, 0.0, streakDist);
          streakContrib *= (1.0 - t * 0.3); // Fade along streak
          streakBrightness = max(streakBrightness, streakContrib);
        }
        
        // Enhanced color shifting for hyperwarp
        vec3 streakColor;
        if (u_speed > 1.5) {
          // Hyperwarp: intense white-blue-purple spectrum
          float colorPhase = sin(u_time * 5.0 + brightness * 10.0) * 0.5 + 0.5;
          streakColor = mix(vec3(1.0, 0.9, 1.0), vec3(0.3, 0.8, 1.0), colorPhase);
          streakColor = mix(streakColor, vec3(0.8, 0.4, 1.0), u_speed - 1.5);
        } else {
          // Normal warp: blue to white
          streakColor = mix(vec3(0.4, 0.7, 1.0), vec3(1.0), u_speed);
        }
        
        color += streakBrightness * brightness * streakColor;
        
      } else {
        // Normal star dots with twinkle
        float starSize = 0.015 + 0.01 * hash(gridPos + vec2(float(layer) * 75.0));
        float starValue = star(starPos, brightness, starSize);
        
        // Star color varies from white to blue
        vec3 starColor = mix(vec3(0.8, 0.9, 1.0), vec3(1.0), hash(gridPos + vec2(float(layer) * 125.0)));
        color += starValue * starColor;
      }
    }
  }
  
  // Add extra light streaks for hyperwarp mode
  if (u_speed > 1.5) {
    // Random light flashes across the field
    for (int flash = 0; flash < 8; flash++) {
      vec2 flashPos = hash2(vec2(float(flash), floor(u_time * 2.0))) * 2.0;
      float flashDist = length(uv - flashPos);
      float flashIntensity = smoothstep(0.5, 0.0, flashDist);
      
      // Flickering intensity
      float flashFlicker = sin(u_time * 20.0 + float(flash) * 2.0) * 0.5 + 0.5;
      flashFlicker *= sin(u_time * 12.0 + float(flash) * 1.5) * 0.3 + 0.7;
      
      vec3 flashColor = mix(vec3(0.8, 0.9, 1.0), vec3(1.0, 0.7, 1.0), flashFlicker);
      color += flashIntensity * flashFlicker * flashColor * 0.3;
    }
    
    // Additional radial energy bursts
    float burstPhase = sin(u_time * 3.0) * 0.5 + 0.5;
    float burstIntensity = pow(burstPhase, 3.0);
    
    for (int burst = 0; burst < 12; burst++) {
      float angle = float(burst) * 0.523598; // 2*PI/12
      vec2 burstDir = vec2(cos(angle), sin(angle));
      float burstDist = dot(uv, burstDir);
      
      float burstStripe = sin(burstDist * 30.0 + u_time * 8.0) * 0.5 + 0.5;
      burstStripe = pow(burstStripe, 4.0);
      
      vec3 burstColor = vec3(0.6, 0.8, 1.0);
      color += burstStripe * burstIntensity * burstColor * 0.1;
    }
  }
  
  // Add light warping effect at high speeds
  if (u_speed > 0.3) {
    // Create time dilation visual effect
    float warpIntensity = min((u_speed - 0.3) / 0.7, 1.0);
    
    // Radial distortion
    float radialWarp = sin(distFromCenter * 15.0 - u_time * 8.0 * u_speed) * 0.1 * warpIntensity;
    
    // Add chromatic aberration-like effect
    vec3 warpColor = vec3(0.1, 0.3, 0.8) * warpIntensity * 0.5;
    warpColor *= sin(distFromCenter * 20.0 - u_time * 10.0) * 0.5 + 0.5;
    
    color += warpColor;
    
    // Add energy field effect around edges
    float edgeGlow = smoothstep(0.8, 1.2, distFromCenter);
    edgeGlow *= warpIntensity;
    color += vec3(0.2, 0.5, 1.0) * edgeGlow * 0.3;
    
    // Enhanced effects for hyperwarp
    if (u_speed > 1.5) {
      float hyperIntensity = (u_speed - 1.5) / 0.5;
      
      // Intense screen-wide flickering
      float screenFlicker = sin(u_time * 25.0) * sin(u_time * 17.0) * sin(u_time * 13.0);
      screenFlicker = screenFlicker * 0.15 + 0.85;
      color *= screenFlicker;
      
      // Reality distortion waves
      float waveDistortion = sin(distFromCenter * 8.0 - u_time * 12.0) * 0.2;
      waveDistortion *= sin(atan(uv.y, uv.x) * 6.0 + u_time * 4.0) * 0.3;
      
      vec3 distortionColor = mix(vec3(1.0, 0.8, 1.0), vec3(0.4, 0.9, 1.0), 
                                 sin(u_time * 6.0) * 0.5 + 0.5);
      color += abs(waveDistortion) * distortionColor * hyperIntensity * 0.4;
      
      // Energy overload effect at screen edges
      float hyperGlow = smoothstep(0.6, 1.4, distFromCenter);
      hyperGlow *= sin(u_time * 8.0) * 0.3 + 0.7;
      
      vec3 overloadColor = vec3(1.0, 0.9, 1.0);
      color += hyperGlow * overloadColor * hyperIntensity * 0.6;
      
      // Add electrical arcing effects
      float arcPhase = floor(u_time * 8.0);
      vec2 arcSeed = vec2(arcPhase, 0.0);
      for (int arc = 0; arc < 4; arc++) {
        vec2 arcStart = hash2(arcSeed + vec2(float(arc))) * 1.5;
        vec2 arcEnd = hash2(arcSeed + vec2(float(arc) + 10.0)) * 1.5;
        
        float arcDist = length(cross(vec3(uv - arcStart, 0.0), vec3(arcEnd - arcStart, 0.0))) 
                       / length(arcEnd - arcStart);
        float arcIntensity = smoothstep(0.05, 0.0, arcDist);
        
        vec3 arcColor = vec3(0.9, 0.95, 1.0);
        color += arcIntensity * arcColor * hyperIntensity * 0.8;
      }
    }
  }
  
  gl_FragColor = vec4(color, 1.0);
}