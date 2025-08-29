import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"
import {
  defineShaderModes,
  type ShaderConfiguration
} from "$lib/modules/webgl/shaders/index.svelte"

export type ShaderMode = "normal" | "inverted"

export const shaderConfig: ShaderConfiguration<ShaderMode> = {
  initialMode: "normal",
  modes: defineShaderModes({
    normal: {
      invert: false
    },
    inverted: {
      invert: true
    }
  }),
  tweens: {}
}

export const colorCyclingPlasma = {
  vertex: vertexShader,
  fragment: fragmentShader,
  config: shaderConfig
}
