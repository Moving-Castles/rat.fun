<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let canvas = $state<HTMLCanvasElement>()

  onMount(() => {
    // Always ensure the global shaderManager has our canvas
    if (canvas) {
      // Set the canvas on the global shaderManager
      shaderManager.canvas = canvas

      // If shaders were previously disabled due to context exhaustion,
      // the canvas might be hidden. Try to restore it.
      if (shaderManager.isContextExhausted && canvas) {
        console.log(
          "[ShaderGlobal] Context was exhausted, canvas will remain hidden until recovery"
        )
      }
    }
  })

  onDestroy(() => {
    // Don't destroy the global shader manager here as it's shared across the app
    // The global shader manager should persist for the lifetime of the app
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
    width: 100dvw;
    height: 100dvh;
    overflow: hidden;
    z-index: var(--z-background);
    background: var(--background);
  }

  .shader-canvas {
    display: block;
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
</style>
