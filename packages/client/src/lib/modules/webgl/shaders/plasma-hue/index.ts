import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"
import { type ShaderConfiguration } from "$lib/modules/webgl/shaders/index.svelte"

export type ShaderMode = "default"

export const shaderConfig: ShaderConfiguration<ShaderMode> = {
  initialMode: "default",
  modes: {
    default: {}
  },
  tweens: {}
}

export const plasmaHue = {
  vertex: vertexShader,
  fragment: fragmentShader,
  config: shaderConfig
}
