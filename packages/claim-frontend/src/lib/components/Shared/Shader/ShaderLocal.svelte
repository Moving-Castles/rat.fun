<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { shaders, createShaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { errorHandler } from "$lib/modules/error-handling"
  import { singleFrameRender } from "$lib/modules/ui/state.svelte"
  import { get } from "svelte/store"

  let { shaderKey }: { shaderKey: keyof typeof shaders } = $props()

  const localShaderManager = createShaderManager({
    errorHandler,
    singleFrameRender: () => get(singleFrameRender)
  })

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
    background: var(--background);

    .shader-canvas {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
</style>
