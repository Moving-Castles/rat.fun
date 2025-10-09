import { Tween } from "svelte/motion"
import { get } from "svelte/store"
import { player } from "$lib/modules/state/stores"
import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"
import { type ShaderConfiguration } from "$lib/modules/webgl/shaders/index.svelte"

export type ShaderMode = "off" | "stars" | "clouds" | "clouds-inverted" | "hyperspeed" | "warpspeed"

export const shaderConfig: ShaderConfiguration<ShaderMode> = {
  // Start style
  initialMode: "off",
  // Modes
  modes: {
    off: {
      opacity: 0.2,
      speed: 0.5,
      invert: 0.0,
      clouds_amount: 0.0,
      nebula_amount: 0.0,
      trippy: 0.0
    },
    stars: {
      opacity: 1.0,
      speed: 0.5,
      invert: 0.0,
      clouds_amount: 0.0,
      nebula_amount: 1.0,
      trippy: 0.0
    },
    // Have to add
    clouds: {
      opacity: 1.0,
      speed: 0.5,
      invert: 0.0,
      clouds_amount: 1.0,
      nebula_amount: 0.0,
      trippy: 0.0
    },
    "clouds-inverted": {
      opacity: 1.0,
      speed: -0.5,
      invert: 1.0,
      clouds_amount: 1.0,
      nebula_amount: 0.0,
      trippy: 0.0
    },
    warpspeed: {
      opacity: 1.0,
      invert: 0.0,
      speed: 0.5,
      clouds_amount: 0.1,
      nebula_amount: 0.5,
      trippy: 1.2
    },
    hyperspeed: {
      opacity: 1.0,
      speed: 0.5,
      invert: 1.0,
      clouds_amount: 0.1,
      nebula_amount: 10.0,
      trippy: 2.0
    }
  },
  tweens: {
    opacity: { value: 1, duration: 1000 },
    speed: { value: 1, duration: 200 },
    invert: { value: 1, duration: 100 },
    clouds_amount: { value: 1, duration: 200 },
    nebula_amount: { value: 1, duration: 1000 },
    trippy: { value: 0, duration: 4000 }
  },
  getMode: (page: import("@sveltejs/kit").Page): string => {
    if (!page.route.id) return "stars"

    if (page.route.id === "/(main)/(game)/[tripId]/tripping/[outcomeId]") {
      return "stars"
    } else if (page.route.id === "/(main)/(game)/[tripId]/tripping") {
      return "off"
    } else if (page.route.id.includes("(game)")) {
      // not spawned
      if (!get(player)) {
        return "off"
      } else {
        return "clouds"
      }
    } else if (page.route.id.includes("admin")) {
      return "off"
    }

    return "stars"
  }
}

export const ratfun = {
  vertex: vertexShader,
  fragment: fragmentShader,
  config: shaderConfig
}
