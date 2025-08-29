import { Tween } from "svelte/motion"
import { WebGLGeneralRenderer } from "$lib/modules/webgl"

// Re-export all shaders from their respective folders
import { main } from "./main/index.svelte"
import { noise } from "./noise"
import { gradient } from "./gradient"
import { waves } from "./waves"
import { plasma } from "./plasma"
import { plasmaHue } from "./plasma-hue"
import { plasmaOptimized } from "./plasma-optimized"
import { clouds } from "./clouds"
import { zoomTunnel } from "./zoom-tunnel"
import { spiralVortex } from "./spiral-vortex"
import { colorCyclingPlasma } from "./color-cycling-plasma"
import { checkerZoomer } from "./checker-zoomer"
import { lissajousWarpField } from "./lissajous-warp-field"
import { kaleidoscopeTunnel } from "./kaleidoscope-tunnel"

const shaders = {
  main,
  noise,
  gradient,
  waves,
  plasma,
  plasmaOptimized,
  plasmaHue,
  clouds,
  zoomTunnel,
  spiralVortex,
  colorCyclingPlasma,
  checkerZoomer,
  lissajousWarpField,
  kaleidoscopeTunnel
}

export type UniformType = "float" | "vec2" | "vec3" | "vec4" | "int" | "bool" | "number"

export type UniformDefinition = {
  name: `u_${string}`
  type?: UniformType
  value: Tween<number> | boolean | number | number[]
}

// Generic types for shader configuration
export type ShaderModeConfig<TMode extends string = string> = Record<TMode, Record<string, number>>

export interface ShaderConfiguration<TMode extends string = string> {
  modes: ShaderModeConfig<TMode>
  tweens: Record<string, Tween<number>>
  initialMode: TMode
}

/**
 * Generic shader state manager that can work with any shader configuration
 */
export class ShaderManager<TMode extends string = string> {
  private renderer: WebGLGeneralRenderer | null = null
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null
  private currentMode = $state<TMode>()

  // Configuration
  private modes: ShaderModeConfig<TMode>
  private tweens: Map<string, Tween<number>> = new Map()

  constructor(config: ShaderConfiguration<TMode>) {
    this.modes = config.modes
    this.currentMode = config.initialMode

    // Store the provided tweens
    Object.entries(config.tweens).forEach(([name, tween]) => {
      this.tweens.set(name, tween)
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
  get uniformValues(): Record<string, number> {
    const values: Record<string, number> = {}
    this.tweens.forEach((tween, name) => {
      values[name] = tween.current
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
  setMode(newMode: TMode) {
    if (!this.modes[newMode]) {
      console.warn(`Mode '${newMode}' not found in configuration`)
      return
    }

    this.currentMode = newMode
    const modeConfig = this.modes[newMode]

    // Update all tweens to new target values
    Object.entries(modeConfig).forEach(([uniformName, targetValue]) => {
      const tween = this.tweens.get(uniformName)
      if (tween) {
        tween.set(targetValue)
      }
    })
  }

  /**
   * Initialize WebGL renderer
   */
  initializeRenderer(canvas: HTMLCanvasElement, shaderSource: any) {
    if (!canvas) return

    // Convert tweens to initial uniform values
    const initialUniforms: Record<
      string,
      {
        type: "float" | "vec2" | "vec3" | "vec4" | "int" | "bool"
        value: number | boolean | number[]
      }
    > = {}

    this.tweens.forEach((tween, name) => {
      initialUniforms[`u_${name}`] = {
        type: "float",
        value: tween.current
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

    this.tweens.forEach((tween, name) => {
      this.renderer!.setUniform(`u_${name}`, tween.current, "float")
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

/**
 * Factory function for creating shader managers with configuration
 */
export function createShaderManager<TMode extends string = string>(
  config: ShaderConfiguration<TMode>
) {
  return new ShaderManager(config)
}

/**
 * Helper function to create mode configurations
 */
export function defineShaderModes<TMode extends string>(
  modes: ShaderModeConfig<TMode>
): ShaderModeConfig<TMode> {
  return modes
}

export { shaders }
