<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { createWebGLRenderer } from "$lib/modules/webgl"
  import { shaders } from "$lib/modules/webgl/shaders"

  let canvas: HTMLCanvasElement
  let renderer: any

  // Debounced resize handler
  let resizeTimeout: ReturnType<typeof setTimeout>
  const handleResize = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      if (renderer) {
        renderer.resize()
      }
    }, 100) // Debounce resize events
  }

  onMount(() => {
    if (!canvas) return

    renderer = createWebGLRenderer(canvas, {
      shader: shaders.plasma
    })
    renderer.render()

    // Add debounced resize listener
    window.addEventListener("resize", handleResize)
  })

  onDestroy(() => {
    if (renderer) {
      renderer.destroy()
    }

    // Clean up event listeners and intervals
    window.removeEventListener("resize", handleResize)
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
  })
</script>

<div class="shader-test" in:fade>
  <canvas bind:this={canvas}></canvas>
</div>

<style lang="scss">
  .shader-test {
    text-align: center;
    color: var(--white);
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  }
</style>
