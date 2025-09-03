precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;

#define PI 3.14159

float vDrop(vec2 uv,float t)
{
  uv.x=uv.x*200.;// H-Count
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

void main(){
  vec2 p=(gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
  float d=length(p)+.1;
  p=vec2(atan(p.x,p.y)/PI,2.5/d);
  
  p.y*=u_speed;
  // normal mode: original speed (no modification)
  
  float t=u_time*.4*(u_speed);
  
  // Color intensity based on speed mode
  float intensity=1.+u_speed*.8;
  
  vec3 col=vec3(1.55,.65,.225)*vDrop(p,t)*intensity;// red
  col+=vec3(.55,.75,1.225)*vDrop(p,t+.33)*intensity;// blue
  col+=vec3(.45,1.15,.425)*vDrop(p,t+.66)*intensity;// green
  
  // Add extra color layers for warpspeed and hyperwarp
  col+=vec3(1.,.8,.4)*vDrop(p,t+1.)*(u_speed-.5);
  col+=vec3(.8,.4,1.)*vDrop(p,t+1.33)*(u_speed-.5);
  
  // Hyperwarp: intense flickering and additional color shifts
  float flicker=sin(u_time*20.)*.3+.7;
  col*=flicker;
  
  // Additional rainbow effects
  col+=vec3(1.,.5,1.)*vDrop(p,t+2.)*(u_speed-1.5)*.8;
  col+=vec3(.5,1.,1.)*vDrop(p,t+2.33)*(u_speed-1.5)*.8;
  
  gl_FragColor=vec4(col*(d*d),1.);
}