<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { shaders } from "$lib/modules/webgl/shaders/index.svelte"
  import { createShaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let { shaderKey }: { shaderKey: keyof typeof shaders } = $props()

  const localShaderManager = createShaderManager()

  let canvasElement = $state<HTMLCanvasElement>()

  onMount(() => {
    if (canvasElement) {
      localShaderManager.canvas = canvasElement
      localShaderManager.setShader(shaderKey)
    }
  })

  onDestroy(() => {
    // console.log("destroying local shader manager")
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

    .shader-canvas {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
</style>
