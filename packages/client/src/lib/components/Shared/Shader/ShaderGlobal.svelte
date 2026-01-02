<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { shaderManager, shaderState } from "$lib/modules/webgl/shaders/index.svelte"
  import { singleFrameRender } from "$lib/modules/ui/state.svelte"

  let canvas = $state<HTMLCanvasElement>()
  let initFailed = $state(false)

  onMount(() => {
    if (canvas) {
      try {
        shaderManager.canvas = canvas
        initFailed = false
      } catch (error) {
        initFailed = true
        // Hide canvas to show CSS black background
        if (canvas) {
          canvas.style.display = "none"
        }
      }
    }
  })

  onDestroy(() => {
    // Don't destroy the global shader manager here as it's shared across the app
    // The global shader manager should persist for the lifetime of the app
    // Instead, this manager should be destroyed by the root layout.
  })
</script>

<div class="shader-container">
  {#if !initFailed || ($singleFrameRender && shaderManager.currentShaderKey?.includes("tripProcessing"))}
    <canvas bind:this={canvas} class="shader-canvas"></canvas>
  {:else if shaderState.currentShaderKey}
    {#key shaderState.currentShaderKey}
      <img
        class="shader-fallback"
        src="/images/shaders/{shaderState.currentShaderKey}.png"
        alt="shader fallback"
      />
    {/key}
  {/if}
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

  .shader-canvas,
  .shader-fallback {
    display: block;
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
</style>
