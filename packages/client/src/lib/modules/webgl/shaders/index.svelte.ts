import { ShaderManager } from "./ShaderManager.svelte"

// Re-export all shaders from their respective folders
import { plasma } from "./plasma"
import { plasmaOptimized } from "./plasma-optimized"
import { clouds } from "./clouds"
import { vortex } from "./vortex"
import { swirlyNoise } from "./swirly-noise"
import { black } from "./black"
import { tripProcessing } from "./trip-processing"

const shaders = {
  plasma,
  plasmaOptimized,
  clouds,
  vortex,
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
function createShaderManager() {
  return new ShaderManager()
}

export {
  // Consts
  shaders,
  // Classes
  ShaderManager,
  // Functions
  createShaderManager
}

export const shaderManager: ShaderManager = $state(createShaderManager())
