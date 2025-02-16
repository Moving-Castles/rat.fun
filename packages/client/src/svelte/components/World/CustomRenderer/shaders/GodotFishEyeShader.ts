/**
 * Full-screen textured quad shader
 */

const GodotFishEyeShader = {
  name: "GodotFishEyeShader",

  uniforms: {
    tDiffuse: { value: null },
    time: { value: 1.0 },
    opacity: { value: 1.0 },
    aspect: { value: 0.7 },
    distortion: { value: 1.0 },
    radius: { value: 1.07 },
    alpha: { value: 1.0 },
    crop: { value: 0.943 },
    crop_feathering: { value: 0.1 },
    base_distortion: { value: 0.99 },
    channel_offset: { value: 0.005 },
    noise_strength: { value: 5.0 },
    crop_color: { value: [0, 0, 0, 1] },
  },

  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

		uniform float opacity;
		uniform sampler2D tDiffuse;

		varying vec2 vUv;
    uniform float time;

    uniform float aspect;
    uniform float distortion;
    uniform float radius;
    uniform float alpha;
    uniform float crop;
    uniform vec4 crop_color;
    uniform float crop_feathering;
    
    uniform float base_distortion;
    uniform float channel_offset;
    uniform float noise_strength;

    vec2 distort (vec2 p) {
      float d = length(p);
      float z = sqrt(distortion + d * d * -distortion);
      float r = atan(d, z) / 3.1415926535;
      float phi = atan(p.y, p.x);
      return vec2(r * cos(phi) * (1.0 / aspect) + 0.5, r * sin(phi) + 0.5);
    }


		void main() {
      vec2 xy = vUv * 2.0 - 1.0;
      xy = vec2(xy.x * aspect, xy.y);
      float d = length(xy);
			vec4 tex = texture2D( tDiffuse, vUv );

      if (d < radius) {
        vec2 distorted_uv_r = distort(xy * (base_distortion + 0.0 * channel_offset));
        vec2 distorted_uv_g = distort(xy * (base_distortion + 1.0 * channel_offset));
        vec2 distorted_uv_b = distort(xy * (base_distortion + 2.0 * channel_offset));

        tex.r = texture(tDiffuse, distorted_uv_r).r;
        tex.g = texture(tDiffuse, distorted_uv_g).g;
        tex.b = texture(tDiffuse, distorted_uv_b).b;

        float x = (vUv.x + .0) * (vUv.y + 4.0) * (time * 10.0);
        tex = tex+vec4(mod((mod(x, 13.0)) * (mod(x, 123.0)), 0.01)-0.005) * noise_strength;

        gl_FragColor = tex;
        gl_FragColor.a = alpha;
      }

      if (d > crop) {
        float softness = smoothstep(crop, crop + crop_feathering, d);
        gl_FragColor = mix(tex, crop_color, softness);
        gl_FragColor.a = alpha;
      }
		}`,
}

export { GodotFishEyeShader }
