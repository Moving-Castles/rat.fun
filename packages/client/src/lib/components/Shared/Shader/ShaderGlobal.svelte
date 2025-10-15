<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let canvas = $state<HTMLCanvasElement>()

  onMount(() => {
    // Always ensure the global shaderManager has our canvas
    if (canvas) {
      // Set the canvas on the global shaderManager
      shaderManager.canvas = canvas
    }
  })

  onDestroy(() => {
    // console.log("destroying global shader manager")
    shaderManager.destroy()
  })
</script>

<div class="shader-container">
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
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
</style>
