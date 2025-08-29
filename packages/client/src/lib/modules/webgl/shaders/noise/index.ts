import { Tween } from "svelte/motion"
import {
  defineShaderModes,
  type ShaderConfiguration
} from "$lib/modules/webgl/shaders/index.svelte"
import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"

export type ShaderMode = "base" | "inverted"

export const shaderConfig: ShaderConfiguration<ShaderMode> = {
  initialMode: "base",

  modes: defineShaderModes({
    base: {
      invert: 0
    },
    inverted: {
      invert: 1
    }
  }),

  tweens: {
    invert: new Tween(0, { duration: 100 })
  }
}

export const noise = {
  vertex: vertexShader,
  fragment: fragmentShader,
  config: shaderConfig
}
