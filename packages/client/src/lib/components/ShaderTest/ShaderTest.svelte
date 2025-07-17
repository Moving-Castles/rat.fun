<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { createWebGLRenderer } from "$lib/modules/webgl"
  import { shaders } from "$lib/modules/webgl/shaders"

  let canvas: HTMLCanvasElement
  let renderer: any

  onMount(() => {
    if (!canvas) return

    renderer = createWebGLRenderer(canvas, {
      shader: shaders.plasma
    })
    renderer.render()

    window.addEventListener("resize", () => renderer.resize())
  })

  onDestroy(() => {
    if (renderer) {
      renderer.destroy()
    }
    window.removeEventListener("resize", () => renderer.resize())
  })
</script>

<div class="shader-test">
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
