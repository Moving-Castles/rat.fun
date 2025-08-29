import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"
import {
  defineShaderModes,
  type ShaderConfiguration
} from "$lib/modules/webgl/shaders/index.svelte"

export type ShaderMode = "default"

export const shaderConfig: ShaderConfiguration<ShaderMode> = {
  initialMode: "default",
  modes: defineShaderModes({
    default: {}
  }),
  tweens: {}
}

export const gradient = {
  vertex: vertexShader,
  fragment: fragmentShader,
  config: shaderConfig
}
