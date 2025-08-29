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

// Fractal noise
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
  vec2 p=uv*8.+u_time*.5;
  
  float noise=fractalNoise(p);
  
  // Create a color pattern
  vec3 color=vec3(noise);
  color=mix(vec3(.1,.3,.8),vec3(.8,.2,.1),color);
  
  color=mix(color,vec3(1.)-color,u_invert);
  
  gl_FragColor=vec4(color,1.);
}