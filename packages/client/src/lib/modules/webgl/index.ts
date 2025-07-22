import type { WebGLRenderer, ShaderSource, WebGLUniforms, WebGLRendererOptions } from "./types"
import {
  WebGLContextError,
  ShaderError,
  WebGLError,
  UniformLocationError
} from "$lib/modules/error-handling/errors"

export class WebGLGeneralRenderer implements WebGLRenderer {
  canvas: HTMLCanvasElement
  gl!: WebGLRenderingContext
  program!: WebGLProgram
  startTime: number
  animationId?: number

  private vertexShader!: WebGLShader
  private fragmentShader!: WebGLShader
  private positionBuffer!: WebGLBuffer
  private positionLocation!: number
  private uniformLocations: Map<string, WebGLUniformLocation | null> = new Map()
  private uniforms: WebGLUniforms
  private autoRender: boolean

  constructor(canvas: HTMLCanvasElement, options: WebGLRendererOptions) {
    this.canvas = canvas
    this.startTime = Date.now()
    this.uniforms = options.uniforms || {}
    this.autoRender = options.autoRender ?? true
    this.initWebGL(options.shader)
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)
    if (!shader) throw new WebGLError("Failed to create shader")

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const shaderType = type === this.gl.VERTEX_SHADER ? "vertex" : "fragment"
      throw new ShaderError(
        "Shader compilation error: " + this.gl.getShaderInfoLog(shader),
        shaderType,
        source
      )
    }

    return shader
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram()
    if (!program) throw new WebGLError("Failed to create program")

    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new WebGLError("Program linking error: " + this.gl.getProgramInfoLog(program))
    }

    return program
  }

  private initWebGL(shader: ShaderSource): void {
    const gl = this.canvas.getContext("webgl")
    if (!gl) throw new WebGLContextError("WebGL not supported")
    this.gl = gl

    // Create shaders
    this.vertexShader = this.createShader(gl.VERTEX_SHADER, shader.vertex)
    this.fragmentShader = this.createShader(gl.FRAGMENT_SHADER, shader.fragment)

    // Create program
    this.program = this.createProgram(this.vertexShader, this.fragmentShader)

    // Create a simple quad geometry
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

    this.positionBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    // Get attribute and uniform locations
    this.positionLocation = gl.getAttribLocation(this.program, "a_position")

    // Setup rendering
    gl.useProgram(this.program)
    gl.enableVertexAttribArray(this.positionLocation)
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0)

    // Cache uniform locations
    this.cacheUniformLocations()

    // Set initial uniforms
    this.updateUniforms()
    this.resize()
  }

  private cacheUniformLocations(): void {
    this.uniformLocations.clear()
    for (const [name] of Object.entries(this.uniforms)) {
      const location = this.gl.getUniformLocation(this.program, name)
      this.uniformLocations.set(name, location)
    }
  }

  private updateUniforms(): void {
    for (const [name, uniform] of Object.entries(this.uniforms)) {
      const location = this.uniformLocations.get(name)
      if (!location) continue

      switch (uniform.type) {
        case "float":
          this.gl.uniform1f(location, uniform.value as number)
          break
        case "vec2": {
          const vec2 = uniform.value as number[]
          this.gl.uniform2f(location, vec2[0], vec2[1])
          break
        }
        case "vec3": {
          const vec3 = uniform.value as number[]
          this.gl.uniform3f(location, vec3[0], vec3[1], vec3[2])
          break
        }
        case "vec4": {
          const vec4 = uniform.value as number[]
          this.gl.uniform4f(location, vec4[0], vec4[1], vec4[2], vec4[3])
          break
        }
        case "int":
          this.gl.uniform1i(location, uniform.value as number)
          break
        case "bool":
          this.gl.uniform1i(location, (uniform.value as boolean) ? 1 : 0)
          break
      }
    }
  }

  setUniform(
    name: string,
    value: number | number[] | boolean,
    type?: "float" | "vec2" | "vec3" | "vec4" | "int" | "bool"
  ): void {
    if (!this.uniforms[name]) {
      throw new UniformLocationError(name)
    }

    this.uniforms[name].value = value
    if (type) {
      this.uniforms[name].type = type
    }

    const location = this.uniformLocations.get(name)
    if (!location) return

    const uniform = this.uniforms[name]
    switch (uniform.type) {
      case "float":
        this.gl.uniform1f(location, uniform.value as number)
        break
      case "vec2": {
        const vec2 = uniform.value as number[]
        this.gl.uniform2f(location, vec2[0], vec2[1])
        break
      }
      case "vec3": {
        const vec3 = uniform.value as number[]
        this.gl.uniform3f(location, vec3[0], vec3[1], vec3[2])
        break
      }
      case "vec4": {
        const vec4 = uniform.value as number[]
        this.gl.uniform4f(location, vec4[0], vec4[1], vec4[2], vec4[3])
        break
      }
      case "int":
        this.gl.uniform1i(location, uniform.value as number)
        break
      case "bool":
        this.gl.uniform1i(location, (uniform.value as boolean) ? 1 : 0)
        break
    }
  }

  render(): void {
    if (!this.gl || !this.program) return

    // Update time uniform if it exists
    const timeLocation = this.gl.getUniformLocation(this.program, "u_time")
    if (timeLocation) {
      const time = (Date.now() - this.startTime) * 0.001
      this.gl.uniform1f(timeLocation, time)
    }

    // Clear and draw
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

    if (this.autoRender) {
      this.animationId = requestAnimationFrame(() => this.render())
    }
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * window.devicePixelRatio
    this.canvas.height = rect.height * window.devicePixelRatio

    // Update resolution uniform if it exists
    const resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution")
    if (resolutionLocation) {
      this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height)
    }
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
}

// Factory function for creating general renderers
export function createWebGLRenderer(
  canvas: HTMLCanvasElement,
  options: WebGLRendererOptions
): WebGLGeneralRenderer {
  return new WebGLGeneralRenderer(canvas, options)
}

// Re-export types and shaders
export type { WebGLRenderer, ShaderSource, WebGLUniforms, WebGLRendererOptions }
