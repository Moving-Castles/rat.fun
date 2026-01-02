import { createShaderManager } from "@ratfun/webgl"
import { errorHandler } from "$lib/modules/error-handling"
import { singleFrameRender } from "$lib/modules/ui/state.svelte"
import { get } from "svelte/store"

// Re-export shaders and ShaderManager for convenience
export { shaders, ShaderManager, createShaderManager } from "@ratfun/webgl"

// Create the singleton shader manager with app-specific dependencies
// singleFrameRender = isPhone || isFirefox (both have slow shader rendering)
export const shaderManager = createShaderManager({
  errorHandler,
  singleFrameRender: () => get(singleFrameRender)
})

// Create reactive state for currentShaderKey
class ReactiveShaderState {
  currentShaderKey = $state<string | null>(null)

  constructor() {
    // Subscribe to shader changes from the manager
    shaderManager.onShaderChange((key) => {
      this.currentShaderKey = key
    })
  }
}

// Export singleton instance with reactive state
export const shaderState = new ReactiveShaderState()
