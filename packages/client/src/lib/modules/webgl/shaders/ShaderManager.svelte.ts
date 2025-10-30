import { WebGLGeneralRenderer } from "$lib/modules/webgl"
import { shaders } from "$lib/modules/webgl/shaders/index.svelte"

export type UniformType = "float" | "vec2" | "vec3" | "vec4" | "int" | "bool" | "number"

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

  constructor() {
    // No initialization needed
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
  setShader(shaderKey: string, inverted: boolean = false) {
    const shaderSource = shaders?.[shaderKey as keyof typeof shaders]

    if (!shaderSource) throw new Error("ShaderNotExistError")

    // Check if we're already showing this shader
    if (this.currentShaderKey === shaderKey && this._renderer) {
      // Just update invert state if different
      if (this.invert !== inverted) {
        this.setInvert(inverted)
      }
      console.log(
        `%c[ShaderManager] Shader "${shaderKey}" already active, skipping recreate`,
        "color: #FF9800"
      )
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
      this.initializeRenderer(this._canvas, shaderSource)
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
   * Clean up resources
   */
  destroy() {
    this.currentShaderKey = null

    if (this._renderer) {
      this._renderer.destroy()
      this._renderer = null
    }

    window.removeEventListener("resize", this.handleResize)

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = null
    }
  }
}
