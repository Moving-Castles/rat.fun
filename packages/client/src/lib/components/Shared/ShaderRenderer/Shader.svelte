<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { afterNavigate } from "$app/navigation"
  import { fade } from "svelte/transition"
  import { page } from "$app/state"
  import { shaders } from "$lib/modules/webgl/shaders/index.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let canvas = $state<HTMLCanvasElement>()
  let currentShader = $state("ratfun")
  let currentMode = $derived(shaders.ratfun.config?.getMode?.(page))
  let uniformValues = $derived(shaderManager.uniformValues)

  $effect(() => {
    if (shaderManager) {
      uniformValues

      shaderManager.updateUniforms()
    }
  })

  onMount(() => {
    if (canvas) {
      const currentShaderObj = shaders[currentShader as keyof typeof shaders]
      shaderManager.initializeRenderer(canvas, currentShaderObj)

      shaderManager.setMode(currentMode)
    }
  })

  onDestroy(() => {
    shaderManager.destroy()
  })

  afterNavigate(() => {
    currentMode = shaders.ratfun.config?.getMode?.(page)
    if (currentMode === "stars") {
      shaderManager.setMode(currentMode, 100)
    } else if (currentMode) {
      shaderManager.setMode(currentMode)
    }
  })
</script>

<div class="shader-container" in:fade={{ duration: 300 }}>
  <canvas bind:this={canvas} class="shader-canvas"></canvas>
</div>

<style lang="scss">
  .shader-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: #000;
  }

  .shader-canvas {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
