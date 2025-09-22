import { Tween } from "svelte/motion"
import { WebGLGeneralRenderer } from "$lib/modules/webgl"
import { shaders } from "$lib/modules/webgl/shaders/index.svelte"

export type UniformType = "float" | "vec2" | "vec3" | "vec4" | "int" | "bool" | "number"

export type UniformDefinition = {
  name: `u_${string}`
  type?: UniformType
  value: Tween<number> | boolean | number | number[]
}

// Generic types for shader configuration
export type ShaderModeConfig<TMode extends string = string> = Record<
  TMode,
  Record<string, number | boolean>
>

export interface ShaderConfiguration<TMode extends string = string> {
  modes: ShaderModeConfig<TMode>
  tweens: Record<string, { value: number; duration: number }>
  initialMode: TMode
  getMode?: (page: import("@sveltejs/kit").Page) => string
}

export class ShaderManager<TMode extends string = string> {
  private renderer: WebGLGeneralRenderer | null = null
  private canvas: HTMLCanvasElement | null = null
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null
  private currentMode = $state<TMode>()
  private modes: ShaderModeConfig<TMode>
  private tweens: Map<string, Tween<number>> = new Map()
  private tweenConfigs: Record<string, any>
  private booleanUniforms = $state<Record<string, boolean>>({})

  constructor(config: ShaderConfiguration<TMode>) {
    this.modes = config.modes
    this.currentMode = config.initialMode
    this.tweenConfigs = config.tweens

    // Store the provided tweens
    Object.entries(config.tweens).forEach(([name, tween]) => {
      this.tweens.set(name, new Tween(tween.value, { duration: tween.duration }))
    })

    // Initialize boolean uniforms by scanning all modes for non-tween values
    const tweenNames = new Set(Object.keys(config.tweens))
    const booleanUniformNames = new Set<string>()

    Object.values(this.modes).forEach(mode => {
      Object.entries(mode).forEach(([uniformName, value]) => {
        if (!tweenNames.has(uniformName) && typeof value === "boolean") {
          booleanUniformNames.add(uniformName)
        }
      })
    })

    // Initialize boolean uniforms with values from initial mode
    const initialModeConfig = this.modes[config.initialMode]
    booleanUniformNames.forEach(uniformName => {
      const initialValue = initialModeConfig[uniformName] as boolean
      this.booleanUniforms[uniformName] = initialValue !== undefined ? initialValue : false
    })
  }

  /**
   * Get current mode
   */
  get mode(): TMode | undefined {
    return this.currentMode
  }

  /**
   * Get all available modes
   */
  get availableModes(): TMode[] {
    return Object.keys(this.modes) as TMode[]
  }

  /**
   * Get current uniform values (reactive)
   */
  get uniformValues(): Record<string, number | boolean> {
    const values: Record<string, number | boolean> = {}
    this.tweens.forEach((tween, name) => {
      values[name] = tween.current
    })
    Object.entries(this.booleanUniforms).forEach(([name, value]) => {
      values[name] = value
    })
    return values
  }

  /**
   * Get uniform definitions for WebGL renderer
   */
  get uniformDefinitions(): UniformDefinition[] {
    return Array.from(this.tweens.entries()).map(([name, tween]) => ({
      name: `u_${name}`,
      value: tween.current
    }))
  }

  /**
   * Set new mode and transition uniforms
   */
  setMode(newMode: TMode, tweenDuration?: number) {
    console.log("setting mode to ", newMode)
    if (!this.modes[newMode]) {
      console.warn(`Mode '${newMode}' not found in configuration`)
      return
    }

    this.currentMode = newMode
    const modeConfig = this.modes[newMode]

    // Update all tweens and boolean uniforms to new target values
    Object.entries(modeConfig).forEach(([uniformName, targetValue]) => {
      const tween = this.tweens.get(uniformName)
      if (tween && typeof targetValue === "number") {
        const config = this.tweenConfigs[uniformName]
        // Handle tween-based uniforms
        if (tweenDuration) {
          tween.set(targetValue, { duration: tweenDuration })
        } else {
          tween.set(targetValue, { duration: config.duration })
        }
      } else if (typeof targetValue === "boolean") {
        // Handle boolean uniforms
        this.booleanUniforms[uniformName] = targetValue
      }
    })
  }

  /**
   * Set new shader programmatically
   */
  setShader(shaderKey: string, mode?: string) {
    const shaderSource = shaders?.[shaderKey as keyof typeof shaders]

    if (!shaderSource) throw new Error("ShaderNotExistError")

    const newConfig = shaderSource.config

    // Destroy current renderer
    if (this.renderer) {
      this.renderer.destroy()
      this.renderer = null
    }

    // Update configuration
    this.modes = newConfig.modes
    this.currentMode = newConfig.initialMode
    this.tweenConfigs = newConfig.tweens

    // Clear existing tweens
    this.tweens.clear()

    // Create new tweens
    Object.entries(newConfig.tweens).forEach(([name, tween]) => {
      this.tweens.set(name, new Tween(tween.value, { duration: tween.duration }))
    })

    // Reinitialize boolean uniforms
    const tweenNames = new Set(Object.keys(newConfig.tweens))
    const booleanUniformNames = new Set<string>()

    Object.values(this.modes).forEach(mode => {
      Object.entries(mode).forEach(([uniformName, value]) => {
        if (!tweenNames.has(uniformName) && typeof value === "boolean") {
          booleanUniformNames.add(uniformName)
        }
      })
    })

    // Reset boolean uniforms
    this.booleanUniforms = {}
    const initialModeConfig = this.modes[newConfig.initialMode]
    booleanUniformNames.forEach(uniformName => {
      const initialValue = initialModeConfig[uniformName] as boolean
      this.booleanUniforms[uniformName] = initialValue !== undefined ? initialValue : false
    })

    // If we have a canvas, reinitialize the renderer
    if (this.canvas) {
      this.initializeRenderer(this.canvas, shaderSource)

      if (mode) {
        this.setMode(mode)
      }
    }
  }

  /**
   * Initialize WebGL renderer
   */
  initializeRenderer(canvas: HTMLCanvasElement, shaderSource: any) {
    if (!canvas) return

    this.canvas = canvas

    // Convert tweens and boolean uniforms to initial uniform values
    const initialUniforms: Record<
      string,
      {
        type: "float" | "vec2" | "vec3" | "vec4" | "int" | "bool"
        value: number | boolean | number[]
      }
    > = {}

    // Add tween-based uniforms
    this.tweens.forEach((tween, name) => {
      initialUniforms[`u_${name}`] = {
        type: "float",
        value: tween.current
      }
    })

    // Add boolean uniforms
    Object.entries(this.booleanUniforms).forEach(([name, value]) => {
      initialUniforms[`u_${name}`] = {
        type: "bool",
        value: value
      }
    })

    // Use the factory function from your WebGL module
    this.renderer = new WebGLGeneralRenderer(canvas, {
      shader: shaderSource,
      uniforms: initialUniforms
    })

    this.renderer.render()

    // Set up resize handling
    window.addEventListener("resize", this.handleResize)
  }

  /**
   * Update uniform values in the shader
   */
  updateUniforms() {
    if (!this.renderer) return

    // Update tween-based uniforms
    this.tweens.forEach((tween, name) => {
      this.renderer!.setUniform(`u_${name}`, tween.current, "float")
    })

    // Update boolean uniforms
    Object.entries(this.booleanUniforms).forEach(([name, value]) => {
      this.renderer!.setUniform(`u_${name}`, value, "bool")
    })
  }

  /**
   * Add or update a uniform at runtime
   */
  addUniform(name: string, tween: Tween<number>) {
    this.tweens.set(name, tween)

    // Add to all modes with the current tween value if not already present
    const currentValue = tween.current
    Object.keys(this.modes).forEach(modeName => {
      if (!(name in this.modes[modeName])) {
        this.modes[modeName][name] = currentValue
      }
    })
  }

  /**
   * Update uniform value for a specific mode
   */
  updateModeUniform(mode: TMode, uniformName: string, value: number) {
    if (!this.modes[mode]) {
      console.warn(`Mode '${mode}' not found`)
      return
    }

    this.modes[mode][uniformName] = value

    // If this is the current mode, update the tween immediately
    if (mode === this.currentMode) {
      const tween = this.tweens.get(uniformName)
      if (tween) {
        tween.set(value)
      }
    }
  }

  /**
   * Update boolean uniform value immediately
   */
  updateBooleanUniform(uniformName: string, value: boolean) {
    // Update the reactive boolean uniform
    this.booleanUniforms[uniformName] = value

    // Update all modes to maintain consistency
    Object.keys(this.modes).forEach(modeName => {
      this.modes[modeName][uniformName] = value
    })

    // Update the renderer immediately if available
    if (this.renderer) {
      this.renderer.setUniform(`u_${uniformName}`, value, "bool")
    }
  }

  /**
   * Debounced resize handler
   */
  private handleResize = () => {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
    }

    this.resizeTimeout = setTimeout(() => {
      if (this.renderer) {
        this.renderer.resize()
      }
    }, 100)
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.renderer) {
      this.renderer.destroy()
      this.renderer = null
    }

    window.removeEventListener("resize", this.handleResize)

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = null
    }
  }
}
