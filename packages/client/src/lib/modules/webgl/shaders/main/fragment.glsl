precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
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
  
  gl_FragColor=vec4(color,1.);
}