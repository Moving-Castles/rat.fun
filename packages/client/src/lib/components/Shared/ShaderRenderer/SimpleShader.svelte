<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { createWebGLRenderer } from "$lib/modules/webgl/index"
  import { shaders } from "$lib/modules/webgl/shaders/index.svelte"

  interface Props {
    shaderKey: string
  }

  let { shaderKey }: Props = $props()
  let canvas = $state<HTMLCanvasElement>()
  let renderer = $state<any>(null)

  onMount(() => {
    if (canvas && shaderKey) {
      const shaderSource = shaders[shaderKey as keyof typeof shaders]
      if (shaderSource) {
        // Get the initial mode configuration for uniforms
        const initialMode = shaderSource.config.initialMode
        const modeConfig = (shaderSource.config.modes as any)[initialMode] || {}

        // Convert mode config to WebGL uniforms format
        const uniforms: Record<
          string,
          { type: "float" | "bool" | "vec2" | "vec3" | "vec4" | "int"; value: any }
        > = {}
        Object.entries(modeConfig).forEach(([key, value]) => {
          if (typeof value === "number") {
            uniforms[key] = { type: "float" as const, value }
          } else if (typeof value === "boolean") {
            uniforms[key] = { type: "bool" as const, value }
          } else if (Array.isArray(value)) {
            if (value.length === 2) {
              uniforms[key] = { type: "vec2" as const, value }
            } else if (value.length === 3) {
              uniforms[key] = { type: "vec3" as const, value }
            } else if (value.length === 4) {
              uniforms[key] = { type: "vec4" as const, value }
            }
          }
        })

        // Ensure canvas has proper dimensions
        const container = canvas.parentElement
        if (container) {
          const rect = container.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            canvas.width = rect.width * window.devicePixelRatio
            canvas.height = rect.height * window.devicePixelRatio
            canvas.style.width = rect.width + "px"
            canvas.style.height = rect.height + "px"
          }
        }

        try {
          renderer = createWebGLRenderer(canvas, {
            shader: {
              vertex: shaderSource.vertex,
              fragment: shaderSource.fragment
            },
            uniforms,
            autoRender: true
          })

          // Test if the renderer is actually rendering
          setTimeout(() => {
            console.log("Checking renderer after 1 second...")
            if (renderer) {
              console.log("Renderer still exists, FPS:", renderer.getFPS())
              // Try to manually render
              console.log("Attempting manual render...")
              renderer.render()
            }
          }, 1000)
        } catch (error) {
          console.error("Failed to create WebGL renderer:", error)
        }

        // Handle window resize
        const handleResize = () => renderer?.resize()
        window.addEventListener("resize", handleResize)

        // Cleanup function
        return () => {
          window.removeEventListener("resize", handleResize)
        }
      }
    }
  })

  onDestroy(() => {
    if (renderer) {
      renderer.destroy()
    }
  })
</script>

<div class="shader-container">
  <canvas bind:this={canvas} class="shader-canvas"></canvas>
</div>

<style lang="scss">
  .shader-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #000;
    z-index: var(--z-background);
  }

  .shader-canvas {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
