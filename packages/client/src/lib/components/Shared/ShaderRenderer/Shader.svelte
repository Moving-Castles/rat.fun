<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { shaders } from "$lib/modules/webgl/shaders/index.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let canvas = $state<HTMLCanvasElement>()
  let currentShader = $state("blank")
  let uniformValues = $derived(shaderManager.uniformValues)

  // Export setShader function for external use
  export function setShader(shaderKey: string) {
    currentShader = shaderKey

    const newConfig = shaders[shaderKey as keyof typeof shaders]?.config
    if (newConfig) {
      shaderManager.setShader(shaderKey, shaders[shaderKey as keyof typeof shaders], newConfig)
    }
  }

  // ???
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
