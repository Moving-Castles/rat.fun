<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { page } from "$app/state"
  import { shaders, createShaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import ShaderManager from "./ShaderManager.svelte"

  let canvas = $state<HTMLCanvasElement>()
  let currentShader = $state("ratfun")
  let currentConfig = $derived(shaders?.[currentShader]?.config || null)
  // Initial check
  if (!currentConfig) {
    throw new Error("ShaderError: Could not instantiate shader: ", currentShader)
  }
  let shaderManager = $state(createShaderManager(currentConfig))

  function getMode(page: import("@sveltejs/kit").Page, shader: string = "ratfun"): string {
    console.log("GET MODE CALLED ", page)
    // Use provided mode getter if it's available
    if (shaders[currentShader].config?.getMode) {
      return shaders[currentShader].config.getMode(page)
    }
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

  // Handle uniform changes from dev controls
  function onUniformChange(uniformName: string, value: number | boolean) {
    if (shaderManager && shaderManager.mode) {
      if (typeof value === "boolean") {
        shaderManager.updateBooleanUniform(uniformName, value)
      } else {
        shaderManager.updateModeUniform(shaderManager.mode, uniformName, value)
      }
    }
  }

  // Programmatic shader setting
  function setShader(shaderKey: string) {
    const newShader = shaderKey
    currentShader = newShader

    // Create new shader manager with new config
    const newConfig = shaders[newShader as keyof typeof shaders]?.config
    if (newConfig) {
      // Use the new setShader method
      shaderManager.setShader(newShader, shaders[newShader as keyof typeof shaders], newConfig)
    }
  }

  // Export the setShader function for external use
  export { setShader }

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
  })
</script>

<div class="shader-container" in:fade={{ duration: 300 }}>
  <canvas bind:this={canvas} class="shader-canvas"></canvas>
  <ShaderManager {onShaderChange} {onModeChange} {onUniformChange} />
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
