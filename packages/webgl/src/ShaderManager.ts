import { WebGLGeneralRenderer } from "./WebGLGeneralRenderer"
import { shaders } from "./shaders"
import { ShaderInitializationError } from "@ratfun/common/error-handling"
import type { UniformType, UniformDefinition } from "./types"

export type ErrorHandler = (error: Error, context?: string) => void

export interface ShaderManagerOptions {
  errorHandler: ErrorHandler
  /** Function that returns whether to render only a single frame (e.g., on phones or Firefox) */
  singleFrameRender: () => boolean
  /** Preserve drawing buffer for canvas capture (enables toDataURL) - impacts performance */
  preserveDrawingBuffer?: boolean
}

export class ShaderManager {
  private _renderer: WebGLGeneralRenderer | null = null
  private _canvas: HTMLCanvasElement | null = null
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null
  private _invert: boolean = false
  private customUniforms: Record<
    string,
    { type: UniformType; value: number | boolean | number[] }
  > = {}
  private _contextExhausted: boolean = false
  private recoveryTimeout: ReturnType<typeof setTimeout> | null = null
  private recoveryAttempts = 0
  private maxRecoveryAttempts = 10
  private forceContinuousRendering = false
  private errorHandler: ErrorHandler
  private singleFrameRender: () => boolean
  private singleFramePauseRafId: number | null = null
  private preserveDrawingBuffer: boolean
  currentShaderKey: string | null = null
  private shaderChangeListeners: Array<(shaderKey: string | null) => void> = []
  private shaderChangeTimeout: ReturnType<typeof setTimeout> | null = null
  private pendingShaderChange: {
    shaderKey: string
    inverted: boolean
    uniforms?: Record<string, { type: UniformType; value: number | boolean | number[] }>
  } | null = null

  constructor(options: ShaderManagerOptions) {
    this.errorHandler = options.errorHandler
    this.singleFrameRender = options.singleFrameRender
    this.preserveDrawingBuffer = options.preserveDrawingBuffer ?? false
  }

  /**
   * Get context exhausted state
   */
  get isContextExhausted(): boolean {
    return this._contextExhausted
  }

  /**
   * Get current invert state
   */
  get isInverted(): boolean {
    return this._invert
  }

  /**
   * Get current renderer
   */
  get renderer(): WebGLGeneralRenderer | null {
    return this._renderer
  }

  /**
   * Set canvas for the shader manager
   */
  set canvas(newCanvas: HTMLCanvasElement | null) {
    this._canvas = newCanvas
    // If we have a renderer, update its canvas reference
    if (this._renderer && newCanvas) {
      this._renderer.canvas = newCanvas
    }
  }

  /**
   * Get current uniform values
   */
  get uniformValues(): Record<string, number | boolean> {
    return {
      invert: this._invert
    }
  }

  /**
   * Get uniform definitions for WebGL renderer
   */
  get uniformDefinitions(): UniformDefinition[] {
    return [
      {
        name: "u_invert" as `u_${string}`,
        value: this._invert
      }
    ]
  }

  /**
   * Subscribe to shader changes
   * @returns Unsubscribe function
   */
  onShaderChange(callback: (shaderKey: string | null) => void): () => void {
    this.shaderChangeListeners.push(callback)
    // Immediately call with current value
    callback(this.currentShaderKey)
    // Return unsubscribe function
    return () => {
      const index = this.shaderChangeListeners.indexOf(callback)
      if (index > -1) {
        this.shaderChangeListeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners of shader change
   */
  private notifyShaderChange() {
    this.shaderChangeListeners.forEach(listener => listener(this.currentShaderKey))
  }

  /**
   * Toggle invert state
   */
  toggleInvert() {
    this._invert = !this._invert
    if (this.renderer) {
      this.renderer.setUniform("u_invert", this._invert, "bool")
    }
  }

  /**
   * Set invert state
   */
  setInvert(inverted: boolean) {
    this._invert = inverted
    if (this._renderer) {
      this._renderer.setUniform("u_invert", this._invert, "bool")
    }
  }

  /**
   * Set new shader programmatically (with debouncing to prevent rapid context creation/destruction)
   */
  setShader(
    shaderKey: string,
    inverted: boolean = false,
    uniforms?: Record<string, { type: UniformType; value: number | boolean | number[] }>
  ) {
    const shaderSource = shaders?.[shaderKey as keyof typeof shaders]

    if (!shaderSource) throw new Error("ShaderNotExistError")

    // Store custom uniforms
    this.customUniforms = uniforms || {}

    // Check if we're already showing this shader
    if (this.currentShaderKey === shaderKey && this._renderer) {
      // Just update invert state if different
      if (this._invert !== inverted) {
        this.setInvert(inverted)
      }
      // Update custom uniforms if renderer exists
      Object.entries(this.customUniforms).forEach(([name, uniform]) => {
        this._renderer?.setUniform(name, uniform.value, uniform.type)
      })
      // Clear any pending shader change since we're already on this shader
      if (this.shaderChangeTimeout) {
        clearTimeout(this.shaderChangeTimeout)
        this.shaderChangeTimeout = null
      }
      this.pendingShaderChange = null
      return
    }

    // Store pending shader change
    this.pendingShaderChange = { shaderKey, inverted, uniforms }

    // Clear any existing timeout
    if (this.shaderChangeTimeout) {
      clearTimeout(this.shaderChangeTimeout)
    }

    // Debounce shader changes to prevent rapid context creation/destruction
    this.shaderChangeTimeout = setTimeout(() => {
      this.shaderChangeTimeout = null
      if (!this.pendingShaderChange) return

      const { shaderKey: pendingKey, inverted: pendingInverted } = this.pendingShaderChange
      this.pendingShaderChange = null

      // Set invert state
      this._invert = pendingInverted
      this.currentShaderKey = pendingKey
      this.notifyShaderChange()

      // Destroy current renderer
      if (this._renderer) {
        this._renderer.destroy()
        this._renderer = null
      }

      // Add microtask delay to allow browser to clean up the old context
      setTimeout(() => {
        // If we have a canvas, reinitialize the renderer
        if (this._canvas) {
          const source = shaders?.[pendingKey as keyof typeof shaders]
          if (!source) return

          try {
            this.initializeRenderer(this._canvas, source)
            // Successfully created renderer, clear exhausted flag
            this._contextExhausted = false
            if (this._canvas) {
              this._canvas.style.display = "block"
            }

            // On mobile/Firefox, pause after first frame unless continuous rendering is forced
            if (this.singleFrameRender() && !this.forceContinuousRendering && this._renderer) {
              // Cancel any pending pause RAF from previous shader
              if (this.singleFramePauseRafId !== null) {
                cancelAnimationFrame(this.singleFramePauseRafId)
                this.singleFramePauseRafId = null
              }
              // Wait for first frame to render, then pause
              // Use double requestAnimationFrame to ensure the frame is actually painted
              this.singleFramePauseRafId = requestAnimationFrame(() => {
                this.singleFramePauseRafId = requestAnimationFrame(() => {
                  this.singleFramePauseRafId = null
                  if (this._renderer && !this.forceContinuousRendering) {
                    this._renderer.pause()
                  }
                })
              })
            }
          } catch (error) {
            // Error already logged to Sentry in initializeRenderer
            console.error(`Failed to initialize shader "${pendingKey}":`, error)

            // Mark context as exhausted and hide canvas to show CSS fallback
            this._contextExhausted = true
            if (this._canvas) {
              this._canvas.style.display = "none"
            }

            // Don't try to create black fallback - it also needs a context!
            // Instead, trigger recovery system
            this.scheduleContextRecovery(pendingKey)
          }
        }
      }, 10) // 10ms microtask delay for browser cleanup
    }, 100) // 100ms debounce for rapid shader changes
  }

  /**
   * Enable continuous rendering (for animations like trip processing)
   */
  enableContinuousRendering() {
    this.forceContinuousRendering = true
    if (this._renderer) {
      this._renderer.resume()
    }
  }

  /**
   * Disable continuous rendering (revert to mobile/Firefox optimization)
   */
  disableContinuousRendering() {
    this.forceContinuousRendering = false
    if (this.singleFrameRender() && this._renderer) {
      this._renderer.pause()
    }
  }

  /**
   * Initialize WebGL renderer
   */
  initializeRenderer(
    canvas: HTMLCanvasElement,
    shaderSource: { vertex: string; fragment: string }
  ) {
    if (!canvas) return

    this._canvas = canvas

    // Set up initial uniforms
    const initialUniforms: Record<
      string,
      {
        type: "float" | "vec2" | "vec3" | "vec4" | "int" | "bool"
        value: number | boolean | number[]
      }
    > = {}

    // Add invert uniform
    initialUniforms["u_invert"] = {
      type: "bool",
      value: this._invert
    }

    // Add custom uniforms
    Object.entries(this.customUniforms).forEach(([name, uniform]) => {
      initialUniforms[name] = uniform
    })

    try {
      this._renderer = new WebGLGeneralRenderer(canvas, {
        shader: shaderSource,
        uniforms: initialUniforms,
        onError: this.errorHandler,
        preserveDrawingBuffer: this.preserveDrawingBuffer
      })

      this._renderer.render()

      // Set up resize handling - remove first to avoid accumulating listeners
      window.removeEventListener("resize", this.handleResize)
      window.addEventListener("resize", this.handleResize)
    } catch (error) {
      console.error("Failed to initialize WebGL renderer:", error)
      this._renderer = null

      // Report to Sentry
      const shaderError = new ShaderInitializationError(
        `Failed to initialize shader renderer: ${error instanceof Error ? error.message : String(error)}`,
        this.currentShaderKey || "unknown",
        error
      )
      this.errorHandler(shaderError, "Shader initialization failed")

      // Re-throw to let caller handle it
      throw shaderError
    }
  }

  /**
   * Update uniform values in the shader
   */
  updateUniforms() {
    if (!this._renderer) return

    // Update invert uniform
    this._renderer.setUniform("u_invert", this._invert, "bool")
  }

  /**
   * Debounced resize handler
   */
  private handleResize = () => {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
    }

    this.resizeTimeout = setTimeout(() => {
      if (this._renderer) {
        this._renderer.resize()
        // In single-frame mode, render one frame after resize to update the display
        if (this.singleFrameRender() && !this.forceContinuousRendering) {
          this._renderer.renderSingleFrame()
        }
      }
    }, 100)
  }

  /**
   * Schedule context recovery attempt
   */
  private scheduleContextRecovery(shaderKey: string) {
    // Clear any existing recovery timeout
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout)
      this.recoveryTimeout = null
    }

    // Don't retry indefinitely
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      return
    }

    this.recoveryAttempts++

    // Wait 5 seconds for contexts to clear, then try again
    this.recoveryTimeout = setTimeout(() => {
      if (this._canvas) {
        const shaderSource = shaders?.[shaderKey as keyof typeof shaders]
        if (shaderSource) {
          try {
            this.initializeRenderer(this._canvas, shaderSource)
            // Success! Reset recovery attempts and show canvas
            this.recoveryAttempts = 0
            this._contextExhausted = false
            if (this._canvas) {
              this._canvas.style.display = "block"
            }
          } catch (error) {
            // Still failing, try again
            console.warn(`Recovery attempt ${this.recoveryAttempts} failed, will retry...`)
            this.scheduleContextRecovery(shaderKey)
          }
        }
      }
    }, 5000)
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.currentShaderKey = null
    this._contextExhausted = false
    this.recoveryAttempts = 0

    if (this._renderer) {
      this._renderer.destroy()
      this._renderer = null
    }

    window.removeEventListener("resize", this.handleResize)

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = null
    }

    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout)
      this.recoveryTimeout = null
    }

    // Cancel any pending shader change timeout
    if (this.shaderChangeTimeout) {
      clearTimeout(this.shaderChangeTimeout)
      this.shaderChangeTimeout = null
    }

    // Clear pending shader change
    this.pendingShaderChange = null

    // Cancel any pending single-frame pause RAF
    if (this.singleFramePauseRafId !== null) {
      cancelAnimationFrame(this.singleFramePauseRafId)
      this.singleFramePauseRafId = null
    }

    // Clear all shader change listeners
    this.shaderChangeListeners = []

    this._canvas = null
  }
}

/**
 * Factory function for creating shader managers
 */
export function createShaderManager(options: ShaderManagerOptions): ShaderManager {
  return new ShaderManager(options)
}
