export interface WebGLRenderer {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  program: WebGLProgram
  startTime: number
  animationId?: number
  destroy(): void
  render(): void
  resize(): void
}

export interface ShaderSource {
  vertex: string
  fragment: string
}

export interface WebGLUniforms {
  [key: string]: {
    type: "float" | "vec2" | "vec3" | "vec4" | "int" | "bool"
    value: number | number[] | boolean
  }
}

export interface WebGLRendererOptions {
  shader: ShaderSource
  uniforms?: WebGLUniforms
  autoRender?: boolean
}
