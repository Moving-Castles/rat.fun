import { createShaderManager } from "@ratfun/webgl"
import { errorHandler } from "$lib/modules/error-handling"
import { singleFrameRender } from "$lib/modules/ui/state.svelte"
import { get } from "svelte/store"

// Re-export shaders and ShaderManager for convenience
export { shaders, ShaderManager, createShaderManager } from "@ratfun/webgl"

// Create the singleton shader manager with app-specific dependencies
export const shaderManager = createShaderManager({
  errorHandler,
  singleFrameRender: () => get(singleFrameRender)
})
