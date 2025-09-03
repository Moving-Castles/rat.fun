precision mediump float;

#define PI 3.14159

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
// To implement:

// Amount of clouds
uniform float u_clouds_amount;
// Invert colors
uniform float u_invert;

// How it works:

// 1. Horizontal segmentation (uv.x*200.): Divides the screen into 200 vertical columns
// 2. Column offset (sin(uv.x*215.4)): Each column gets a random vertical offset
// 3. Speed variation (cos(uv.x*33.1)*.3+.7): Each column animates at slightly different speeds (0.7-1.0x)
// 4. Trail length (mix(95.,35.,s)): Faster columns have shorter trails
// 5. Vertical animation (fract(uv.y+t*s+o)*trail): Creates moving streaks using fractional coordinates
// 6. Intensity shaping: Uses smoothstep and sin to create bright heads with fading tails
// 7. Column width (sin(dx*PI)): Makes streaks thicker in the center of each column
float vDrop(vec2 uv,float t)
{
  uv.x=uv.x*20.;// H-Count
  float dx=fract(uv.x);
  uv.x=floor(uv.x);
  uv.y*=.05;// stretch
  float o=sin(uv.x*215.4);// offset
  float s=cos(uv.x*33.1)*.3+.7;// speed
  float trail=mix(95.,35.,s);// trail length
  float yv=fract(uv.y+t*s+o)*trail;
  yv=1./yv;
  yv=smoothstep(0.,1.,yv*yv);
  yv=sin(yv*PI)*(s*5.);
  float d2=sin(dx*PI);
  return yv*(d2*d2);
}

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

void main(){
  // Basic setup
  
  // ### Clouds part
  //
  //
  // Sky gradient from light blue to darker blue
  vec2 uv=gl_FragCoord.xy/u_resolution;
  
  vec3 skyColor=mix(vec3(.5,.8,1.),vec3(.2,.6,1.),uv.y);
  
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
  
  // ### Stars part
  //
  //
  // Coordinate calculation
  vec2 p=(gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
  float d=length(p)+.1;
  p=vec2(atan(p.x,p.y)/PI,2.5/d);
  p.y*=u_speed;
  
  float t=u_time*.4*u_speed;
  
  // Color intensity based on speed mode
  float intensity=1.+u_speed*.8;
  
  // ### Shaders mixing
  //
  //
  // # Clouds
  vec3 cloudColor=mix(skyColor,vec3(1.),clouds*.9);
  // Apply inversion
  cloudColor=mix(cloudColor,vec3(1.)-cloudColor,u_invert);
  
  // # Stars
  vec3 starColor=vec3(1.55,.65,.225)*vDrop(p,t)*intensity;// red
  starColor+=vec3(.55,.75,1.225)*vDrop(p,t+.33)*intensity;// blue
  starColor+=vec3(.45,1.15,.425)*vDrop(p,t+.66)*intensity;// green
  
  starColor+=vec3(1.,.8,.4)*vDrop(p,t+1.)*(u_speed-.5);
  starColor+=vec3(.8,.4,1.)*vDrop(p,t+1.33)*(u_speed-.5);
  
  starColor=mix(starColor,vec3(1.)-starColor,u_invert);
  starColor*=(d*d);
  
  // Now, mix them both
  vec3 finalColor=mix(starColor,cloudColor,u_clouds_amount);
  
  gl_FragColor=vec4(finalColor,1.);
}