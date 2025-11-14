import { ShaderManager } from "./ShaderManager.svelte"

// Re-export all shaders from their respective folders
import { plasma } from "./plasma"
import { plasmaOptimized } from "./plasma-optimized"
import { clouds } from "./clouds"
import { vortex } from "./vortex"
import { magic } from "./magic"
import { swirlyNoise } from "./swirly-noise"
import { black } from "./black"
import { tripProcessing } from "./trip-processing"
import { get } from "svelte/store"
import { isPhone } from "$lib/modules/ui/state.svelte"

const isPhoneOrFirefox = /Firefox/i.test(navigator.userAgent) || get(isPhone)

const shaders = {
  plasma,
  plasmaOptimized,
  clouds,
  vortex,
  magic,
  swirlyNoise,
  black,
  tripProcessing
}

/**
 * Generic shader state manager that can work with any shader configuration
 */

/**
 * Factory function for creating shader managers
 */
function createShaderManager(resolutionScale: number = 1) {
  console.log("CREATING SHADER MANAGER AT RESOLUTION SCALE", resolutionScale)
  return new ShaderManager(resolutionScale)
}

export {
  // Consts
  shaders,
  // Classes
  ShaderManager,
  // Functions
  createShaderManager
}

export const shaderManager = createShaderManager(isPhoneOrFirefox ? 0.25 : 1)
