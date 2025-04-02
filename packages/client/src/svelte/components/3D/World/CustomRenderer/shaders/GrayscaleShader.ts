const GrayscaleShader = {
    name: 'GrayscaleShader',
    uniforms: {
      "tDiffuse": { value: null },
      "intensity": { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float intensity;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor = vec4(mix(color.rgb, vec3(gray), intensity), color.a);
      }
    `
  };
  
  export { GrayscaleShader };