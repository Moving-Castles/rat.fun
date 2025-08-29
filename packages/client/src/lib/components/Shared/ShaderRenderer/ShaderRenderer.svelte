<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { page } from "$app/state"
  import { shaders } from "$lib/modules/webgl/shaders/index.svelte"
  import { type ShaderMode } from "$lib/modules/webgl/shaders/main/index.svelte"
  import { createShaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"

  let canvas = $state<HTMLCanvasElement>()

  const shaderManager = $state(createShaderManager(shaders.main.config))

  function getMode(page: import("@sveltejs/kit").Page): ShaderMode {
    console.log("Get mode called for:", page.url.pathname, page.route.id)
    if (page.route.id?.includes("admin")) return "admin"
    if (page.url.pathname.includes("enter") || page.url.pathname.includes("outcome"))
      return "outcome"
    if (page.url.searchParams.has("spawn") || $UIState === UI.SPAWNING) return "introduction"
    return "home"
  }

  // Derived reactive values
  const currentMode = $derived(getMode(page))
  const uniformValues = $derived(shaderManager.uniformValues)

  // Effect: Update mode when URL changes
  $effect(() => {
    if (shaderManager) {
      shaderManager.setMode(currentMode)
    }
  })

  // Effect: Update shader uniforms when tween values change
  $effect(() => {
    if (shaderManager) {
      // Access uniformValues to establish dependency on all values
      uniformValues

      // Update the shader renderer
      shaderManager.updateUniforms()
    }
  })

  // Lifecycle
  onMount(() => {
    if (canvas) {
      shaderManager.initializeRenderer(canvas, shaders.main)

      // Set initial mode
      shaderManager.setMode(currentMode)
    }
  })

  onDestroy(() => {
    shaderManager.destroy()
    console.log("Shader manager destroyed")
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
