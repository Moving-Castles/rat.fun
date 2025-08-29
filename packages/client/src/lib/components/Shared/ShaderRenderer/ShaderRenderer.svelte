<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { page } from "$app/state"
  import { shaders } from "$lib/modules/webgl/shaders/index.svelte"
  import { type ShaderMode } from "$lib/modules/webgl/shaders/main/index.svelte"
  import { createShaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  // Component state
  let canvas = $state<HTMLCanvasElement>()
  let mounted = $state(false)

  // Create shader manager
  const shaderManager = $state(createShaderManager(shaders.main.config))

  // URL-based mode detection
  function getModeFromUrl(url: URL): ShaderMode {
    if (url.pathname.includes("/admin")) return "admin"
    if (url.pathname.includes("/enter") || url.pathname.includes("/outcome")) return "outcome"
    if (url.pathname === "/" || url.pathname.includes("/intro")) return "introduction"
    return "home"
  }

  // Derived reactive values
  const currentMode = $derived(getModeFromUrl(page.url))
  const uniformValues = $derived(shaderManager.uniformValues)

  // Effect: Update mode when URL changes
  $effect(() => {
    if (mounted) {
      console.log(`Shader mode changed to: ${currentMode}`)
      shaderManager.setMode(currentMode)
    }
  })

  // Effect: Update shader uniforms when tween values change
  $effect(() => {
    if (mounted && shaderManager) {
      // Access all uniform values to establish dependencies
      uniformValues.spiral
      uniformValues.invert
      uniformValues.saturation
      uniformValues.contrast
      uniformValues.exposure
      uniformValues.glow

      // Update the shader renderer
      shaderManager.updateUniforms()
    }
  })

  // Lifecycle
  onMount(() => {
    if (canvas) {
      shaderManager.initializeRenderer(canvas, shaders.main)
      mounted = true

      // Set initial mode
      shaderManager.setMode(currentMode)
    }
  })

  onDestroy(() => {
    mounted = false
    shaderManager.destroy()
    console.log("Shader manager destroyed")
  })
</script>

<div class="shader-container" in:fade={{ duration: 300 }}>
  <canvas bind:this={canvas} class="shader-canvas"></canvas>

  <!-- Status indicator -->
  <div class="status-indicator" class:active={mounted}>
    <div class="dot"></div>
    <span>{mounted ? "Active" : "Loading..."}</span>
  </div>
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
