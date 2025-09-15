precision mediump float;

#define PI 3.14159

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform float u_clouds_amount;
uniform float u_opacity;
uniform float u_invert;

// Simple hash function for noise
float hash(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
}

// Smooth interpolation
float smoothNoise(vec2 p){
  vec2 i=floor(p);
  vec2 f=fract(p);
  f=f*f*(3.-2.*f);
  
  float a=hash(i);
  float b=hash(i+vec2(1.,0.));
  float c=hash(i+vec2(0.,1.));
  float d=hash(i+vec2(1.,1.));
  
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}

// Fractal noise for clouds
float fractalNoise(vec2 p){
  float value=0.;
  float amplitude=.5;
  float frequency=1.;
  
  for(int i=0;i<4;i++){
    value+=amplitude*smoothNoise(p*frequency);
    amplitude*=.5;
    frequency*=2.;
  }
  
  return value;
}

// Fractal noise for "dangerous zones"
float dangerousZones(vec2 p){
  float value=.2;
  float amplitude=.8;
  float frequency=2.;
  
  for(int i=0;i<3;i++){
    value+=amplitude*smoothNoise(p*frequency+u_time*.1);
    amplitude*=.5;
    frequency*=2.;
  }
  
  return value;
}

// Star field generation
float starField(vec2 p){
  // Get the danger level at this position
  float danger=dangerousZones(p*1.);
  
  // Generate star candidates with offset grid
  vec2 cell=floor(p*40.);
  vec2 cellPos=fract(p*40.);
  
  // Add random offset to each cell to break up grid pattern
  vec2 offset=vec2(hash(cell),hash(cell+vec2(100.,200.)))-.5;
  offset*=.8;// Control how much cells can shift
  
  // Adjust cell position with offset
  vec2 starPos=cellPos+offset;
  
  float starChance=hash(cell);
  float survivalRoll=hash(cell+vec2(10.,500.));
  
  // Stars survive if their survival roll is greater than danger level
  float survives=step(danger*.8,survivalRoll);
  
  // Create star brightness - now using offset position
  float dist=length(starPos-.5);
  float brightness=1.-smoothstep(.01,.08,dist);
  
  // Only show bright stars to reduce density
  float threshold=.7+danger*.2;// Higher threshold in dangerous zones
  float showStar=step(threshold,starChance);
  
  return showStar*survives*brightness;
}

// Nebula clouds
float nebulaClouds(vec2 p){
  return smoothNoise(p*1.5+u_time*.05)*.5+
  smoothNoise(p*3.+u_time*.03)*.3+
  smoothNoise(p*6.+u_time*.02)*.2;
}

vec3 normalClouds(vec2 uv){
  vec3 skyColor=mix(
    vec3(.5,.8,1.),// Light blue at top
    vec3(.2,.6,1.),// Darker blue at bottom
    uv.y
  );
  
  // Create multiple layers of clouds
  vec2 cloudPos1=uv*3.+vec2(u_time*.1,0.);
  vec2 cloudPos2=uv*5.+vec2(u_time*.05,0.);
  vec2 cloudPos3=uv*2.+vec2(u_time*.15,0.);
  
  float cloud1=fractalNoise(cloudPos1);
  float cloud2=fractalNoise(cloudPos2);
  float cloud3=fractalNoise(cloudPos3);
  
  // Combine cloud layers
  float clouds=max(cloud1,max(cloud2*.7,cloud3*.5));
  
  // Threshold clouds to make them more defined
  clouds=smoothstep(.4,.6,clouds);
  
  // Add some variation to cloud density
  clouds*=.8+.2*sin(u_time*.5);
  
  // Mix sky and clouds
  vec3 color=mix(skyColor,vec3(1.),clouds*.9);
  
  return color;
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  
  // Deep space background
  vec3 spaceColor=vec3(.05,.02,.1);
  
  // Generate star field using noise-based approach
  vec2 starPos=uv*2.+u_time*.01*u_speed;
  float stars=starField(starPos);
  
  // Add some twinkling effect
  stars*=.8+.2*sin(u_time*3.+hash(floor(starPos*50.))*10.);
  
  // Generate nebula clouds
  vec2 cloudPos=uv*1.5+u_time*.02*u_speed;
  float clouds=nebulaClouds(cloudPos);
  clouds=smoothstep(.3,.7,clouds);
  
  // Color the stars
  vec3 starColor=mix(spaceColor,vec3(.9,.9,1.),stars);
  
  // Color the nebulae with subtle purples and blues
  vec3 nebulaColor=mix(vec3(.3,.1,.5),vec3(.1,.3,.8),clouds);
  
  // No nebula
  // vec3 nebulaColor=vec3(0.);
  
  nebulaColor*=clouds;
  
  // Combine everything
  vec3 starfieldColor=starColor+nebulaColor;
  
  vec3 cloudColor=normalClouds(uv);
  
  vec3 finalColor=mix(starfieldColor,cloudColor,u_clouds_amount);
  
  // Apply inversion if needed
  finalColor=mix(finalColor,vec3(1.)-finalColor,u_invert);
  
  // Apply opacity
  finalColor*=u_opacity;
  
  gl_FragColor=vec4(finalColor,1.);
}