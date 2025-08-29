import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"
import { Tween } from "svelte/motion"
import { cubicInOut, elasticOut, bounceOut } from "svelte/easing"
import {
  defineShaderModes,
  type ShaderConfiguration
} from "$lib/modules/webgl/shaders/index.svelte"

// Define shader mode types
export type ShaderMode = "introduction" | "admin" | "home" | "outcome"

// Complete shader configuration
export const shaderConfig: ShaderConfiguration<ShaderMode> = {
  initialMode: "introduction",

  modes: defineShaderModes({
    introduction: {
      spiral: 0,
      invert: 0.3,
      saturation: 1,
      contrast: 0.5,
      exposure: 0,
      glow: 0.2
    },
    home: {
      spiral: 0,
      invert: 0,
      saturation: 1,
      contrast: 0.5,
      exposure: 0,
      glow: 0.5
    },
    admin: {
      spiral: 0,
      invert: 1,
      saturation: 1,
      contrast: 0.8,
      exposure: 0.2,
      glow: 0.7
    },
    outcome: {
      spiral: 1,
      invert: 1,
      saturation: 0,
      contrast: -1,
      exposure: 1,
      glow: 1.0
    }
  }),

  tweens: {
    spiral: new Tween(0, {
      easing: cubicInOut,
      duration: 1000
    }),
    invert: new Tween(0, {
      easing: cubicInOut,
      duration: 0
    }),
    saturation: new Tween(1, {
      duration: 300
    }),
    contrast: new Tween(0.5, {
      duration: 400,
      easing: elasticOut
    }),
    exposure: new Tween(0, {
      duration: 200
    }),
    glow: new Tween(0.2, {
      duration: 600,
      easing: bounceOut
    })
  }
}

export const main = {
  vertex: vertexShader,
  fragment: fragmentShader,
  config: shaderConfig
}
