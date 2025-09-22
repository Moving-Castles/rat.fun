import { shaders } from "$lib/modules/webgl-old/shaders"
import type { ShaderSource } from "$lib/modules/webgl-old/types"
import { WebGLGeneralRenderer } from "$lib/modules/webgl-old/index"

export const activeShader: { shader: ShaderSource | null } = $state({ shader: null })
export const webglRenderer: { renderer: WebGLGeneralRenderer | null } = $state({ renderer: null })
export const isInitialized: { initialized: boolean } = $state({ initialized: false })

let fullscreenCanvas: HTMLCanvasElement | null = null

export const initializeWebGL = () => {
  console.log("initializing webgl")
  if (isInitialized.initialized) {
    console.log("WebGL already initialized")
    return
  }

  try {
    // Create fullscreen canvas
    fullscreenCanvas = document.createElement("canvas")
    fullscreenCanvas.id = "webgl-fullscreen-canvas"
    console.log("Created canvas:", fullscreenCanvas)

    // Style the canvas to be fullscreen at the bottom z-index
    Object.assign(fullscreenCanvas.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "-1",
      pointerEvents: "none"
    })

    // Add canvas to document
    document.body.appendChild(fullscreenCanvas)
    console.log("Canvas added to document body")

    // Force canvas size
    fullscreenCanvas.width = window.innerWidth
    fullscreenCanvas.height = window.innerHeight
    console.log("Canvas sized to:", fullscreenCanvas.width, "x", fullscreenCanvas.height)

    // Set up resize handler
    const handleResize = () => {
      if (webglRenderer.renderer) {
        webglRenderer.renderer.resize()
      }
    }

    window.addEventListener("resize", handleResize)

    isInitialized.initialized = true
    console.log(
      "WebGL initialized with fullscreen canvas, canvas size:",
      fullscreenCanvas.width,
      "x",
      fullscreenCanvas.height
    )
  } catch (error) {
    console.error("Failed to initialize WebGL:", error)
  }
}

export const destroyWebGL = () => {
  if (webglRenderer.renderer) {
    webglRenderer.renderer.destroy()
    webglRenderer.renderer = null
  }

  if (fullscreenCanvas && fullscreenCanvas.parentNode) {
    fullscreenCanvas.parentNode.removeChild(fullscreenCanvas)
    fullscreenCanvas = null
  }

  isInitialized.initialized = false
  console.log("WebGL destroyed")
}

export const initializeShader = () => {
  console.log("initializing shader")
  if (!isInitialized.initialized) {
    initializeWebGL()
  }
  setActiveShader(null)
}

export function setActiveShader(shaderKey: keyof typeof shaders | null) {
  console.log("setActiveShader called with:", shaderKey)

  if (!shaderKey || !shaders[shaderKey]) {
    console.log("No valid shader key provided, clearing shader")
    activeShader.shader = null
    if (webglRenderer.renderer) {
      // Stop rendering when no shader is active
      webglRenderer.renderer.destroy()
      webglRenderer.renderer = null
    }
    // Hide the canvas when no shader is active
    if (fullscreenCanvas) {
      fullscreenCanvas.style.display = "none"
    }
    return
  }

  const newShader = shaders[shaderKey]
  console.log("Found shader:", newShader)
  activeShader.shader = newShader

  // If WebGL is initialized, update the renderer with new shader
  console.log("isInitialized:", isInitialized.initialized, "fullscreenCanvas:", !!fullscreenCanvas)

  // Show the canvas when setting a valid shader
  if (fullscreenCanvas) {
    fullscreenCanvas.style.display = "block"
  }

  if (isInitialized.initialized && fullscreenCanvas) {
    try {
      console.log("Creating new renderer with shader:", shaderKey)

      // Destroy existing renderer
      if (webglRenderer.renderer) {
        console.log("Destroying existing renderer")
        webglRenderer.renderer.destroy()
      }

      // Create new renderer with the selected shader
      webglRenderer.renderer = new WebGLGeneralRenderer(fullscreenCanvas, {
        shader: newShader,
        autoRender: true,
        uniforms: {
          u_invert: {
            type: "bool",
            value: false
          }
        }
      })

      console.log("Shader switched to:", shaderKey, "Renderer created:", !!webglRenderer.renderer)

      // Manually start rendering to ensure it begins
      if (webglRenderer.renderer) {
        webglRenderer.renderer.render()
        console.log("Manually started render loop")
      }
    } catch (error) {
      console.error("Failed to switch shader:", error)
    }
  } else {
    console.log("WebGL not initialized or canvas not available")
    if (!isInitialized.initialized) {
      console.log("Initializing WebGL...")
      initializeWebGL()
    }
  }
}
