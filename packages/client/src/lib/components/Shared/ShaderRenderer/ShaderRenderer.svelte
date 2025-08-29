<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { page } from "$app/state"
  import { shaders, createShaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import ShaderManager from "./ShaderManager.svelte"

  let canvas = $state<HTMLCanvasElement>()
  let currentShader = $state("main")
  let shaderManager = $state(createShaderManager(shaders.main.config))

  function getMode(page: import("@sveltejs/kit").Page, shader: string = "main"): string {
    console.log("Get mode called for:", page.url.pathname, page.route.id, "shader:", shader)

    // Handle different shader types
    if (shader === "main") {
      if (page.route.id?.includes("admin")) return "admin"
      if (page.route.id?.includes("outcome")) return "outcome"
      return "introduction"
    }

    if (shader === "noise") {
      if (page.route.id?.includes("admin")) return "base"
      return "inverted"
    }

    // For other shaders, check if they have modes
    const shaderObj = shaders[shader as keyof typeof shaders]
    if (shaderObj?.config?.modes) {
      const modes = Object.keys(shaderObj.config.modes)
      return modes.length > 0 ? modes[0] : "default"
    }

    return "default"
  }

  // Derived reactive values
  const currentMode = $derived(getMode(page, currentShader))
  const uniformValues = $derived(shaderManager.uniformValues)

  // Handle shader changes from dev controls
  function onShaderChange(key: string) {
    const newShader = key
    currentShader = newShader

    // Create new shader manager with new config
    const newConfig = shaders[newShader as keyof typeof shaders]?.config
    if (newConfig) {
      // Destroy old manager
      shaderManager.destroy()

      // Create new manager
      shaderManager = createShaderManager(newConfig)

      // Reinitialize with canvas if available
      if (canvas) {
        shaderManager.initializeRenderer(canvas, shaders[newShader as keyof typeof shaders])
      }
    }
  }

  // Handle mode changes from dev controls
  function onModeChange(key: string) {
    if (shaderManager) {
      shaderManager.setMode(key as any)
    }
  }

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
      const currentShaderObj = shaders[currentShader as keyof typeof shaders]
      shaderManager.initializeRenderer(canvas, currentShaderObj)

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
  <ShaderManager {onShaderChange} {onModeChange} />
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
