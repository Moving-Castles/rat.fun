import { Tween } from "svelte/motion"
import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"
import { type ShaderConfiguration } from "$lib/modules/webgl/shaders/index.svelte"

export type ShaderMode = "off" | "stars" | "clouds" | "clouds-inverted" | "hyperspeed" | "warpspeed"

export const shaderConfig: ShaderConfiguration<ShaderMode> = {
  // Start style
  initialMode: "stars",
  // Modes
  modes: {
    off: {
      opacity: 0.0,
      speed: 0.0,
      invert: 0.0,
      clouds_amount: 0.0
    },
    stars: {
      opacity: 1.0,
      speed: 1.0,
      invert: 0.0,
      clouds_amount: 0.0
    },
    // Have to add
    clouds: {
      opacity: 1.0,
      speed: 1.0,
      invert: 0.0,
      clouds_amount: 1.0
    },
    "clouds-inverted": {
      opacity: 1.0,
      speed: 1.0,
      invert: 1.0,
      clouds_amount: 1.0
    },
    warpspeed: {
      opacity: 1.0,
      invert: 0.0,
      speed: 1.0,
      clouds_amount: 0.1
    },
    hyperspeed: {
      opacity: 1.0,
      speed: 2.0,
      invert: 0.0,
      clouds_amount: 0.1
    }
  },
  tweens: {
    opacity: new Tween(1, { duration: 100 }),
    speed: new Tween(1, { duration: 5000 }),
    invert: new Tween(1, { duration: 100 }),
    clouds_amount: new Tween(1, { duration: 1000 })
  },
  getMode: (page: import("@sveltejs/kit").Page): string => {
    if (!page.route.id) return "normal"

    if (page.route.id.includes("result")) {
      // Start mode is off, the rest of the modes will be set by the component itself
      return "off"
    } else if (page.route.id.includes("(game)")) {
      return "clouds"
    } else if (page.route.id.includes("admin")) {
      return "clouds-inverted"
    }

    return "stars"
  }
}

export const ratfun = {
  vertex: vertexShader,
  fragment: fragmentShader,
  config: shaderConfig
}
