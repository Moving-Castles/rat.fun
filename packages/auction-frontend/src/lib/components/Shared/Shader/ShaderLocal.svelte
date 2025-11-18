<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { shaders } from "$lib/modules/webgl/shaders/index.svelte"
  import { createShaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let { shaderKey }: { shaderKey: keyof typeof shaders } = $props()

  const localShaderManager = createShaderManager()

  let canvasElement = $state<HTMLCanvasElement>()
  let initFailed = $state(false)

  onMount(() => {
    if (canvasElement) {
      try {
        localShaderManager.canvas = canvasElement
        localShaderManager.setShader(shaderKey)
        initFailed = false
      } catch (error) {
        console.warn(`[ShaderLocal] Failed to initialize "${shaderKey}", hiding canvas`, error)
        initFailed = true
        // Hide canvas to show CSS black background
        if (canvasElement) {
          canvasElement.style.display = "none"
        }
      }
    }
  })

  onDestroy(() => {
    localShaderManager.destroy()
  })
</script>

<div class="shader-container" in:fade={{ duration: 300 }}>
  <canvas bind:this={canvasElement} class="shader-canvas"></canvas>
</div>

<style lang="scss">
  .shader-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;

    .shader-canvas {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
</style>
