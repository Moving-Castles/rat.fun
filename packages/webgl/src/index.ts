// Main exports
export { WebGLGeneralRenderer, createWebGLRenderer } from "./WebGLGeneralRenderer"
export { ShaderManager, createShaderManager } from "./ShaderManager"
export { setWebGLLoggingEnabled, isWebGLLoggingEnabled } from "./logger"

// Type exports
export type {
  WebGLRenderer,
  ShaderSource,
  WebGLUniforms,
  WebGLRendererOptions,
  UniformType,
  UniformDefinition
} from "./types"

export type { ErrorHandler, ShaderManagerOptions } from "./ShaderManager"

// Re-export shaders for convenience
export * from "./shaders"
