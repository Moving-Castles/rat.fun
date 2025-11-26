precision mediump float;

// ============================================================================
// CONFIGURATION VARIABLES
// ============================================================================

// Zoom effect parameters
#define ZOOM_POWER 1.5// Power curve for zoom acceleration
#define ZOOM_INTENSITY.3// Zoom intensity multiplier

// Time-based intensity parameters
#define INTENSITY_PEAK_TIME 8.0// Time in seconds when intensity peaks
#define INTENSITY_POWER.3// Power curve for intensity ramp-up

// Pattern frequency parameters
#define NUM_HOR_BANDS 10.0// Number of horizontal bands
#define NUM_RINGS 5.0// Number of radial rings
#define NUM_ARMS 6.0// Number of spiral arms

// Spiral parameters
#define SPIRAL_ANGLE 1.047197551// π/3 radians (60 degrees)

// Color parameters - Magical purple/pink/cyan theme
#define COLOR_AMPLITUDE .85// Amplitude for color oscillation
#define COLOR_SPEED 2.5// Speed of color animation

// Mathematical constants
#define PI 3.14159265359// π constant
#define HALF.5// 0.5 for centering
#define ONE 1.0// 1.0 for full values
#define TWO 2.0// 2.0 for doubling
#define ZERO.0// 0.0 for zero values

// ============================================================================
// UNIFORMS
// ============================================================================

uniform float u_time;// Animation time
uniform vec2 u_resolution;// Screen resolution
uniform bool u_invert;// Whether to invert colors

// ============================================================================
// MAIN SHADER
// ============================================================================

void main(){
  // Normalize fragment coordinates to [0,1] range
  vec2 position=gl_FragCoord.xy/u_resolution;
  
  // Center coordinates around top right corner
  float cX=position.x-.5;// Offset from right edge
  float cY=position.y-.5;// Offset from top edge
  
  // Convert to log-polar coordinates for spiral effects
  float newX=log(sqrt(cX*cX+cY*cY));// Radial distance (log scale)
  float newY=atan(cX,cY);// Angular position
  
  // Calculate time-based intensity multiplier with exponential ramp-up
  float normalizedTime=min(u_time/INTENSITY_PEAK_TIME,ONE);
  float intensityMultiplier=pow(normalizedTime,INTENSITY_POWER);
  
  // Initialize color accumulator
  float color=ZERO;
  
  // Add horizontal bands pattern
  color+=cos(NUM_HOR_BANDS*cX-u_time*intensityMultiplier);
  
  // Add radial rings pattern
  color+=cos(NUM_RINGS*newX-u_time*intensityMultiplier);
  
  // Add spiral arms pattern
  color+=cos(TWO*NUM_ARMS*(newX*sin(SPIRAL_ANGLE)+newY*cos(SPIRAL_ANGLE))+u_time*intensityMultiplier);
  
  // Create final color with magical purple/pink/cyan theme
  vec3 finalColor=vec3(
    sin(color+u_time/COLOR_SPEED*intensityMultiplier)*COLOR_AMPLITUDE+.1,// Red (magenta/pink)
    sin(color+u_time/COLOR_SPEED*intensityMultiplier+PI*.5)*COLOR_AMPLITUDE*.9,// Green (reduced for purple)
    cos(color+u_time/COLOR_SPEED*intensityMultiplier)*COLOR_AMPLITUDE+.1// Blue (cyan/purple)
  );
  
  // Apply color inversion if enabled
  finalColor=u_invert?vec3(ZERO)-finalColor:finalColor;
  
  // Output final color with full alpha
  gl_FragColor=vec4(finalColor,ONE);
}
