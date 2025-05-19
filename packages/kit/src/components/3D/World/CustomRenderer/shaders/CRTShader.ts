/**
 * Full-screen textured quad shader
 */

const CRTShader = {
  name: "CRTShader",

  uniforms: {
    tDiffuse: { value: null },
    opacity: { value: 1 },
    scan: { value: 0.75 },
    warp: { value: 0.0 },
  },

  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `
		uniform float warp;
		uniform float scan;
		uniform float opacity;
		uniform sampler2D tDiffuse;

    uniform vec2 resolution;

		varying vec2 vUv;

		void main() {

    // Create a local copy of vUv to work with
    vec2 uv = vUv;

    // Squared distance from center
    vec2 dc = abs(0.5 - uv);
    dc *= dc;

    // Warp the fragment coordinates
    uv.x = uv.x - 0.5;
    uv.x *= 1.0 + (dc.y * (0.3 * warp));
    uv.x += 0.5;

    uv.y = uv.y - 0.5;
    uv.y *= 1.0 + (dc.x * (0.4 * warp));
    uv.y += 0.5;

    // Sample inside boundaries, otherwise set to black
    if (uv.y > 1.0 || uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0) {
      gl_FragColor = vec4(0.0,0.0,0.0,1.0);
    } else {
      // determine if we are drawing in a scanline
      float apply = abs(sin(gl_FragCoord.y)*0.5*scan);
        // sample the texture
      vec4 texel = texture2D( tDiffuse, vUv );
      gl_FragColor = vec4(mix(texel.rgb,vec3(0.0),apply),1.0);
    }    
  }`,
}
// vec4 texel = texture2D( tDiffuse, vUv );
// gl_FragColor = opacity * texel;

export { CRTShader }

// // squared distance from center
// vec2 uv = fragCoord/iResolution.xy;
// vec2 dc = abs(0.5-uv);
// dc *= dc;

// // warp the fragment coordinates
// uv.x -= 0.5; uv.x *= 1.0+(dc.y*(0.3*warp)); uv.x += 0.5;
// uv.y -= 0.5; uv.y *= 1.0+(dc.x*(0.4*warp)); uv.y += 0.5;

// // sample inside boundaries, otherwise set to black
// if (uv.y > 1.0 || uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0)
//     fragColor = vec4(0.0,0.0,0.0,1.0);
// else
//   {
//     // determine if we are drawing in a scanline
//     float apply = abs(sin(fragCoord.y)*0.5*scan);
//     // sample the texture
//   fragColor = vec4(mix(texture(iChannel0,uv).rgb,vec3(0.0),apply),1.0);
//     }
// }
