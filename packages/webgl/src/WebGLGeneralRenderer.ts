import type { WebGLRenderer, ShaderSource, WebGLUniforms, WebGLRendererOptions } from "./types"
import {
  WebGLContextError,
  WebGLContextLimitError,
  ShaderError,
  WebGLError,
  UniformLocationError
} from "@ratfun/common/error-handling"
import { logger } from "./logger"

/**
 * A general-purpose WebGL renderer that can render shaders to a canvas.
 * Supports automatic rendering, uniform management, and performance monitoring.
 */
// Track active contexts globally for debugging
const activeContexts = new WeakMap<
  HTMLCanvasElement,
  WebGLRenderingContext | WebGL2RenderingContext
>()
let activeContextCount = 0
let totalContextsCreated = 0

export class WebGLGeneralRenderer implements WebGLRenderer {
  canvas: HTMLCanvasElement
  gl!: WebGLRenderingContext | WebGL2RenderingContext
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
  private frameCount: number = 0
  private lastFrameTime: number = 0
  private fps: number = 0
  private frameInterval: number = 1000 / 60
  private shaderSource: ShaderSource
  private contextLost: boolean = false
  private isPaused: boolean = false
  private onError?: (error: Error, context?: string) => void
  private preserveDrawingBuffer: boolean

  /**
   * Creates a new WebGL renderer instance.
   * @param canvas - The HTML canvas element to render to
   * @param options - Configuration options for the renderer
   */
  constructor(canvas: HTMLCanvasElement, options: WebGLRendererOptions) {
    this.canvas = canvas
    this.startTime = performance.now()
    this.uniforms = options.uniforms || {}
    this.autoRender = options.autoRender ?? true
    this.frameInterval = 1000 / (options.targetFPS ?? 60)
    this.shaderSource = options.shader
    this.onError = options.onError
    this.preserveDrawingBuffer = options.preserveDrawingBuffer ?? false

    this.initWebGL(options.shader)
    this.setupContextLossHandlers()

    // Track context creation/reuse
    const existingContext = activeContexts.get(canvas)
    if (!existingContext || existingContext !== this.gl) {
      // New context created (or canvas was reused with different context)
      if (!existingContext) {
        totalContextsCreated++
        activeContextCount++
      }
      activeContexts.set(canvas, this.gl)
    }
  }

  /**
   * Report an error using the configured error handler
   */
  private reportError(error: Error, context?: string): void {
    if (this.onError) {
      this.onError(error, context)
    }
  }

  /**
   * Creates and compiles a WebGL shader.
   * @param type - The shader type (VERTEX_SHADER or FRAGMENT_SHADER)
   * @param source - The shader source code
   * @returns The compiled WebGL shader
   * @throws Error if shader creation or compilation fails
   */
  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)
    if (!shader) {
      const error = new WebGLError("Failed to create shader")
      this.reportError(error, "WebGL shader creation failed")
      throw error
    }

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const shaderType = type === this.gl.VERTEX_SHADER ? "vertex" : "fragment"
      const errorLog = this.gl.getShaderInfoLog(shader)
      const error = new ShaderError("Shader compilation error: " + errorLog, shaderType, source)
      this.reportError(error, "Shader compilation failed")
      throw error
    }

    return shader
  }

  /**
   * Creates and links a WebGL program from vertex and fragment shaders.
   * @param vertexShader - The compiled vertex shader
   * @param fragmentShader - The compiled fragment shader
   * @returns The linked WebGL program
   * @throws Error if program creation or linking fails
   */
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram()
    if (!program) {
      const error = new WebGLError("Failed to create program")
      this.reportError(error, "WebGL program creation failed")
      throw error
    }

    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const errorLog = this.gl.getProgramInfoLog(program)
      const error = new WebGLError("Program linking error: " + errorLog)
      this.reportError(error, "WebGL program linking failed")
      throw error
    }

    return program
  }

  /**
   * Initializes the WebGL context and sets up the rendering pipeline.
   * Creates shaders, program, buffers, and configures the rendering state.
   * @param shader - The shader source code for vertex and fragment shaders
   * @throws Error if WebGL is not supported or initialization fails
   */
  private initWebGL(shader: ShaderSource): void {
    // Check if canvas already has a context (reusing same canvas)
    const gl = this.canvas.getContext("webgl", {
      preserveDrawingBuffer: this.preserveDrawingBuffer
    })

    // If context is null or lost, try to get a fresh one
    if (!gl || gl.isContextLost()) {
      // Check if we've hit the context limit
      const errorMessage =
        gl === null
          ? "Failed to create WebGL context. This could be due to too many active WebGL contexts or WebGL not being supported."
          : "WebGL context lost"

      const error =
        activeContextCount >= 16
          ? new WebGLContextLimitError(
              `${errorMessage} (${activeContextCount} active contexts)`,
              activeContextCount
            )
          : new WebGLContextError(errorMessage)

      this.reportError(error, "Failed to initialize WebGL")
      throw error
    }

    this.gl = gl

    // Create shaders
    this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, shader.vertex)
    this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, shader.fragment)

    // Create program
    this.program = this.createProgram(this.vertexShader, this.fragmentShader)

    // Create a simple quad geometry
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

    this.positionBuffer = this.gl.createBuffer()!
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW)

    // Get attribute and uniform locations
    this.positionLocation = this.gl.getAttribLocation(this.program, "a_position")

    // Setup rendering
    this.gl.useProgram(this.program)
    this.gl.enableVertexAttribArray(this.positionLocation)
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0)

    // Cache uniform locations
    this.cacheUniformLocations()

    // Set initial uniforms
    this.updateUniforms()
    this.resize()
  }

  /**
   * Caches uniform locations for efficient uniform updates.
   * Stores uniform locations in a Map for quick access during rendering.
   */
  private cacheUniformLocations(): void {
    this.uniformLocations.clear()

    // Cache all uniform locations including time and resolution
    const uniformNames = [...Object.keys(this.uniforms), "u_time", "u_resolution"]
    for (const name of uniformNames) {
      const location = this.gl.getUniformLocation(this.program, name)
      this.uniformLocations.set(name, location)
    }
  }

  /**
   * Sets up WebGL context loss and restore event handlers.
   */
  private setupContextLossHandlers(): void {
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost, false)
    this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored, false)
  }

  /**
   * Handles WebGL context loss event.
   */
  private handleContextLost = (event: Event): void => {
    event.preventDefault()
    this.contextLost = true

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = undefined
    }

    logger.warn("context lost")
  }

  /**
   * Handles WebGL context restore event.
   */
  private handleContextRestored = (): void => {
    logger.log("context restored, reinitializing")
    this.contextLost = false

    try {
      this.initWebGL(this.shaderSource)
      if (this.autoRender) {
        this.render()
      }
    } catch (error) {
      logger.error("failed to restore context")
      // Error already reported in initWebGL
    }
  }

  /**
   * Updates all uniforms in the shader program.
   * Sets uniform values based on their type (float, vec2, vec3, vec4, int, bool).
   */
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

  /**
   * Sets a uniform value in the shader program.
   * @param name - The name of the uniform variable
   * @param value - The value to set (number, array, or boolean)
   * @param type - Optional type override for the uniform
   * @throws Error if the uniform is not found in the shader
   */
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

  /**
   * Renders a single frame using the current shader program.
   * Updates time uniform, clears the viewport, and draws the quad.
   * If autoRender is enabled, schedules the next frame.
   */
  render(): void {
    if (!this.gl || !this.program || this.contextLost) {
      if (this.autoRender && !this.isPaused) {
        this.animationId = requestAnimationFrame(() => this.render())
      }
      return
    }

    // If paused, don't render or schedule next frame
    if (this.isPaused) {
      return
    }

    const currentTime = performance.now()

    // Frame rate limiting - only schedule next frame after we render
    if (currentTime - this.lastFrameTime < this.frameInterval) {
      if (this.autoRender) {
        this.animationId = requestAnimationFrame(() => this.render())
      }
      return
    }

    this.lastFrameTime = currentTime
    this.frameCount++

    // Update time uniform if it exists (using cached location)
    const timeLocation = this.uniformLocations.get("u_time")
    if (timeLocation) {
      // Use performance.now() for more precise timing
      const time = (currentTime - this.startTime) * 0.001
      this.gl.uniform1f(timeLocation, time)
    }

    // Clear and draw
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.clearColor(0, 0, 0, 1)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

    // Calculate FPS every 60 frames
    if (this.frameCount % 60 === 0) {
      const elapsed = currentTime - this.startTime
      this.fps = Math.round((this.frameCount / elapsed) * 1000)
    }

    if (this.autoRender) {
      this.animationId = requestAnimationFrame(() => this.render())
    }
  }

  /**
   * Resizes the canvas and updates the resolution uniform.
   * Adjusts canvas size based on device pixel ratio and updates u_resolution uniform.
   */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * window.devicePixelRatio
    this.canvas.height = rect.height * window.devicePixelRatio

    // Update resolution uniform if it exists (using cached location)
    const resolutionLocation = this.uniformLocations.get("u_resolution")
    if (resolutionLocation) {
      this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height)
    }
  }

  /**
   * Gets the current FPS of the renderer.
   * @returns The current frames per second
   */
  getFPS(): number {
    return this.fps
  }

  /**
   * Pauses the rendering loop.
   * Useful for mobile/background scenarios to save resources.
   */
  pause(): void {
    this.isPaused = true
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = undefined
    }
  }

  /**
   * Resumes the rendering loop after being paused.
   */
  resume(): void {
    this.isPaused = false
    if (this.autoRender && !this.animationId) {
      this.animationId = requestAnimationFrame(() => this.render())
    }
  }

  /**
   * Renders a single frame without starting the animation loop.
   * Useful for static renders or manual frame control.
   */
  renderSingleFrame(): void {
    if (!this.gl || !this.program || this.contextLost) {
      return
    }

    const currentTime = performance.now()
    this.lastFrameTime = currentTime
    this.frameCount++

    // Update time uniform if it exists
    const timeLocation = this.uniformLocations.get("u_time")
    if (timeLocation) {
      const time = (currentTime - this.startTime) * 0.001
      this.gl.uniform1f(timeLocation, time)
    }

    // Clear and draw
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.clearColor(0, 0, 0, 1)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
  }

  /**
   * Destroys the renderer and cleans up resources.
   * Cancels any pending animation frames and frees WebGL resources.
   *
   * Note: We don't call loseContext() because it makes the canvas unusable
   * for future WebGL contexts. Instead, we let the browser's garbage collector
   * handle context cleanup when there are no more references.
   */
  destroy(): void {
    // Remove context loss handlers
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost)
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored)

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = undefined
    }

    if (this.gl && this.program) {
      try {
        // Check if WebGL context is still valid
        const isContextLost = this.gl.isContextLost()
        if (!isContextLost) {
          this.gl.deleteShader(this.vertexShader)
          this.gl.deleteShader(this.fragmentShader)
          this.gl.deleteProgram(this.program)
          this.gl.deleteBuffer(this.positionBuffer)

          // Note: We intentionally don't call loseContext() here
          // Calling loseContext() makes the canvas permanently unusable
          // The browser will GC the context when there are no more references
        }

        // Track context destruction
        if (activeContexts.has(this.canvas)) {
          activeContexts.delete(this.canvas)
          activeContextCount--
        }
      } catch (error) {
        // WebGL context may be lost or invalid, ignore cleanup errors
        logger.warn("cleanup failed, context may be lost")
      } finally {
        this.uniformLocations.clear()
        // Clear references to allow garbage collection
        this.gl = null as unknown as WebGLRenderingContext | WebGL2RenderingContext
        this.program = null as unknown as WebGLProgram
        this.vertexShader = null as unknown as WebGLShader
        this.fragmentShader = null as unknown as WebGLShader
        this.positionBuffer = null as unknown as WebGLBuffer
      }
    }
  }
}

/**
 * Factory function for creating WebGL renderers.
 * @param canvas - The HTML canvas element to render to
 * @param options - Configuration options for the renderer
 * @returns A new WebGLGeneralRenderer instance
 */
export function createWebGLRenderer(
  canvas: HTMLCanvasElement,
  options: WebGLRendererOptions
): WebGLGeneralRenderer {
  return new WebGLGeneralRenderer(canvas, options)
}
