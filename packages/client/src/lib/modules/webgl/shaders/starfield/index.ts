import { Tween } from "svelte/motion"
import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"
import { type ShaderConfiguration } from "$lib/modules/webgl/shaders/index.svelte"

export type ShaderMode = "normal" | "warpspeed" | "hyperwarp"

export const shaderConfig: ShaderConfiguration<ShaderMode> = {
  initialMode: "normal",
  modes: {
    normal: {
      speed: 0.0
    },
    warpspeed: {
      speed: 1.0
    },
    hyperwarp: {
      speed: 2.0
    }
  },
  tweens: {
    speed: new Tween(0, { duration: 5000 })
  }
}

export const starfield = {
  vertex: vertexShader,
  fragment: fragmentShader,
  config: shaderConfig
}
