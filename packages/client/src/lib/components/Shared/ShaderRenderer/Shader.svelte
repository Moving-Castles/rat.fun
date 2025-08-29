<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { page } from "$app/state"
  import { shaders, createShaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let canvas = $state<HTMLCanvasElement>()
  let currentShader = $state("main")
  let shaderManager = $state(createShaderManager(shaders.main.config))

  function getMode(page: import("@sveltejs/kit").Page): string {
    if (page.route.id?.includes("admin")) return "admin"
    if (page.route.id?.includes("outcome")) return "outcome"
    return "introduction"
  }

  const currentMode = $derived(getMode(page))
  const uniformValues = $derived(shaderManager.uniformValues)

  $effect(() => {
    if (shaderManager) {
      shaderManager.setMode(currentMode)
    }
  })

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
