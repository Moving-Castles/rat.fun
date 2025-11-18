import { WebGLGeneralRenderer } from "$lib/modules/webgl"
import { shaders } from "$lib/modules/webgl/shaders/index.svelte"
import { ShaderInitializationError } from "$lib/modules/error-handling/errors"
import { errorHandler } from "$lib/modules/error-handling"

export type UniformType = "float" | "vec2" | "vec3" | "vec4" | "int" | "bool"

export type UniformDefinition = {
  name: `u_${string}`
  type?: UniformType
  value: number | boolean | number[]
}

export class ShaderManager {
  private _renderer: WebGLGeneralRenderer | null = null
  private _canvas: HTMLCanvasElement | null = null
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null
  private invert = $state<boolean>(false)
  private currentShaderKey: string | null = null
  private customUniforms: Record<
    string,
    { type: UniformType; value: number | boolean | number[] }
  > = {}
  private contextExhausted = $state<boolean>(false)
  private recoveryTimeout: ReturnType<typeof setTimeout> | null = null
  private recoveryAttempts = 0
  private maxRecoveryAttempts = 10

  constructor() {
    // No initialization needed
  }

  /**
   * Get context exhausted state
   */
  get isContextExhausted(): boolean {
    return this.contextExhausted
  }

  /**
   * Get current invert state
   */
  get isInverted(): boolean {
    return this.invert
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
   * Get current uniform values (reactive)
   */
  get uniformValues(): Record<string, number | boolean> {
    return {
      invert: this.invert
    }
  }

  /**
   * Get uniform definitions for WebGL renderer
   */
  get uniformDefinitions(): UniformDefinition[] {
    return [
      {
        name: "u_invert" as `u_${string}`,
        value: this.invert
      }
    ]
  }

  /**
   * Toggle invert state
   */
  toggleInvert() {
    this.invert = !this.invert
    if (this.renderer) {
      this.renderer.setUniform("u_invert", this.invert, "bool")
    }
  }

  /**
   * Set invert state
   */
  setInvert(inverted: boolean) {
    this.invert = inverted
    if (this._renderer) {
      this._renderer.setUniform("u_invert", this.invert, "bool")
    }
  }

  /**
   * Set new shader programmatically
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
      if (this.invert !== inverted) {
        this.setInvert(inverted)
      }
      // Update custom uniforms if renderer exists
      Object.entries(this.customUniforms).forEach(([name, uniform]) => {
        this._renderer?.setUniform(name, uniform.value, uniform.type)
      })
      // console.log(
      //   `%c[ShaderManager] Shader "${shaderKey}" already active, skipping recreate`,
      //   "color: #FF9800"
      // )
      return
    }

    // Set invert state
    this.invert = inverted
    this.currentShaderKey = shaderKey

    // Destroy current renderer
    if (this._renderer) {
      this._renderer.destroy()
      this._renderer = null
    }

    // If we have a canvas, reinitialize the renderer
    if (this._canvas) {
      try {
        this.initializeRenderer(this._canvas, shaderSource)
        // Successfully created renderer, clear exhausted flag
        this.contextExhausted = false
        if (this._canvas) {
          this._canvas.style.display = "block"
        }
      } catch (error) {
        // Error already logged to Sentry in initializeRenderer
        console.error(`Failed to initialize shader "${shaderKey}":`, error)

        // Mark context as exhausted and hide canvas to show CSS fallback
        this.contextExhausted = true
        if (this._canvas) {
          this._canvas.style.display = "none"
          // console.warn(
          //   `%c[ShaderManager] Context exhausted. Canvas hidden, showing CSS fallback background. Will retry in 5s...`,
          //   "color: #FF5722; font-weight: bold"
          // )
        }

        // Don't try to create black fallback - it also needs a context!
        // Instead, trigger recovery system
        this.scheduleContextRecovery(shaderKey)
      }
    }
  }

  /**
   * Initialize WebGL renderer
   */
  initializeRenderer(canvas: HTMLCanvasElement, shaderSource: any) {
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
      value: this.invert
    }

    // Add custom uniforms
    Object.entries(this.customUniforms).forEach(([name, uniform]) => {
      initialUniforms[name] = uniform
    })

    try {
      // Use the factory function from your WebGL module
      this._renderer = new WebGLGeneralRenderer(canvas, {
        shader: shaderSource,
        uniforms: initialUniforms
      })

      this._renderer.render()

      // Set up resize handling
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
      errorHandler(shaderError, "Shader initialization failed: ")

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
    this._renderer.setUniform("u_invert", this.invert, "bool")
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
      // console.error(
      //   `%c[ShaderManager] Max recovery attempts (${this.maxRecoveryAttempts}) reached. Giving up.`,
      //   "color: #F44336; font-weight: bold"
      // )
      return
    }

    this.recoveryAttempts++

    // Wait 5 seconds for contexts to clear, then try again
    this.recoveryTimeout = setTimeout(() => {
      // console.log(
      //   `%c[ShaderManager] Attempting context recovery (attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})...`,
      //   "color: #2196F3; font-weight: bold"
      // )

      if (this._canvas) {
        const shaderSource = shaders?.[shaderKey as keyof typeof shaders]
        if (shaderSource) {
          try {
            this.initializeRenderer(this._canvas, shaderSource)
            // Success! Reset recovery attempts and show canvas
            this.recoveryAttempts = 0
            this.contextExhausted = false
            if (this._canvas) {
              this._canvas.style.display = "block"
            }
            console.log(
              `%c[ShaderManager] Context recovery successful!`,
              "color: #4CAF50; font-weight: bold"
            )
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
    this.contextExhausted = false
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
  }
}
