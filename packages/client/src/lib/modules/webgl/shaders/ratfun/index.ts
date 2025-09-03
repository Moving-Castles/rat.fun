import { Tween } from "svelte/motion"
import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"
import {
  defineShaderModes,
  type ShaderConfiguration
} from "$lib/modules/webgl/shaders/index.svelte"

export type ShaderMode = "stars" | "clouds" | "clouds-inverted" | "hyperspeed" | "warpspeed"

export const shaderConfig: ShaderConfiguration<ShaderMode> = {
  // Start style
  initialMode: "stars",
  // Modes
  modes: defineShaderModes({
    stars: {
      speed: 1.0,
      invert: 0.0,
      clouds_amount: 0.0
    },
    // Have to add
    clouds: {
      speed: 1.0,
      invert: 0.0,
      clouds_amount: 1.0
    },
    "clouds-inverted": {
      speed: 1.0,
      invert: 1.0,
      clouds_amount: 1.0
    },
    warpspeed: {
      invert: 0.0,
      speed: 1.2,
      clouds_amount: 0.0
    },
    hyperspeed: {
      speed: 2.0,
      invert: 0.0,
      clouds_amount: 0.0
    }
  }),
  tweens: {
    speed: new Tween(1, { duration: 5000 }),
    invert: new Tween(1, { duration: 100 }),
    clouds_amount: new Tween(1, { duration: 1000 })
  },
  getMode: (page: import("@sveltejs/kit").Page): string => {
    if (!page.route.id) return "normal"

    if (page.route.id.includes("result")) {
      if (page.url.searchParams.has("hyperspeed")) {
        return "hyperspeed"
      } else {
        return "warpspeed"
      }
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
