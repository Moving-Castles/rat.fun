precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_invert;
uniform float u_saturation;
uniform float u_contrast;
uniform float u_exposure;

// Simple hash function for noise
float hash(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
}

// Contrast
vec3 adjustContrast(vec3 color,float value){
  return.5+(1.+value)*(color-.5);
}

// Exposure
vec3 adjustExposure(vec3 color,float value){
  return(1.+value)*color;
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
  vec2 uv=gl_FragCoord.xy/u_resolution;
  
  // Sky gradient from light blue to darker blue
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
  
  color=mix(color,vec3(1.)-color,u_invert);
  
  // Use saturation factor to blend between greyscale and color
  float greyScaleValue=color.r*.3+color.g*.59+color.b*.11;
  
  // Compute each component based on saturation level. 0 is greyscale, 1 is color
  float rValue=mix(greyScaleValue,color.r,u_saturation);
  float gValue=mix(greyScaleValue,color.g,u_saturation);
  float bValue=mix(greyScaleValue,color.b,u_saturation);
  
  // Put them together
  vec3 adjustedColor=vec3(rValue,gValue,bValue);
  
  // Contrast adjustment
  // adjustedColor=adjustContrast(adjustedColor,u_contrast);
  
  // exposure adjustment
  // adjustedColor=adjustExposure(adjustedColor,u_exposure);
  
  gl_FragColor=vec4(adjustedColor,1.);
}