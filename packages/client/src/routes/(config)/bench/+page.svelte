<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { shaders, createShaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { errorHandler } from "$lib/modules/error-handling"
  import { createLogger } from "$lib/modules/logger"

  const logger = createLogger("[ShaderShowcase]")

  type ShaderKey = keyof typeof shaders

  // Password protection
  const PASSWORD = "shaders"
  let isAuthenticated = $state(false)
  let passwordInput = $state("")
  let passwordError = $state(false)

  // Available shaders
  const shaderKeys = Object.keys(shaders) as ShaderKey[]

  // State
  let selectedShader = $state<ShaderKey>("plasma")
  let canvasWidth = $state(800)
  let canvasHeight = $state(600)
  let canvasElement = $state<HTMLCanvasElement>()
  let isRendering = $state(false)
  let inverted = $state(false)

  // Custom uniform controls
  let customUniformEnabled = $state(false)
  let uniformName = $state("")
  let uniformType = $state<"float" | "vec2" | "vec3" | "vec4" | "int" | "bool">("float")
  let uniformValue = $state("")
  let customUniforms = $state<Record<string, { type: any; value: any }>>({})

  // Create a local shader manager for single-frame renders
  const localShaderManager = createShaderManager({
    errorHandler,
    singleFrameRender: () => true, // Always single frame for showcase
    preserveDrawingBuffer: true // Enable canvas capture for PNG export
  })

  // Preset sizes
  const presets = $derived([
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Desktop", width: 1920, height: 1080 },
    { name: "Square", width: 800, height: 800 },
    { name: "Custom", width: canvasWidth, height: canvasHeight }
  ])

  let selectedPreset = $state("Custom")

  // Apply preset
  function applyPreset(presetName: string) {
    selectedPreset = presetName
    const preset = presets.find(p => p.name === presetName)
    if (preset) {
      canvasWidth = preset.width
      canvasHeight = preset.height
      // No need to call renderCurrentShader - the $effect will handle it
    }
  }

  // Render the current shader
  async function renderCurrentShader() {
    if (!canvasElement) return

    isRendering = true
    try {
      // Initialize shader manager with the canvas first
      localShaderManager.canvas = canvasElement

      // Set and render the shader with invert and custom uniforms
      localShaderManager.setShader(
        selectedShader,
        inverted,
        Object.keys(customUniforms).length > 0 ? customUniforms : undefined
      )

      // After shader is initialized, set the canvas size and update viewport
      canvasElement.width = canvasWidth
      canvasElement.height = canvasHeight

      // Update the renderer's resolution uniform and viewport
      if (localShaderManager.renderer) {
        const gl = localShaderManager.renderer.gl
        const program = localShaderManager.renderer.program

        // Update viewport
        gl.viewport(0, 0, canvasWidth, canvasHeight)

        // Update resolution uniform
        const resolutionLocation = gl.getUniformLocation(program, "u_resolution")
        if (resolutionLocation) {
          gl.uniform2f(resolutionLocation, canvasWidth, canvasHeight)
        }

        // Render a single frame with the new size
        localShaderManager.renderer.renderSingleFrame()
      }

      logger.log(
        `Rendered shader: ${selectedShader} at ${canvasWidth}x${canvasHeight}`,
        inverted ? "(inverted)" : "",
        customUniforms
      )
    } catch (error) {
      logger.error("Failed to render shader:", error)
    } finally {
      isRendering = false
    }
  }

  // Add custom uniform
  function addCustomUniform() {
    if (!uniformName.trim()) return

    let parsedValue: number | boolean | number[]

    try {
      if (uniformType === "bool") {
        parsedValue = uniformValue.toLowerCase() === "true"
      } else if (uniformType === "int" || uniformType === "float") {
        parsedValue = parseFloat(uniformValue)
      } else {
        // vec2, vec3, vec4
        parsedValue = uniformValue.split(",").map(v => parseFloat(v.trim()))
      }

      customUniforms[uniformName] = {
        type: uniformType,
        value: parsedValue
      }

      // Clear form
      uniformName = ""
      uniformValue = ""

      logger.log("Added custom uniform:", customUniforms)
    } catch (error) {
      logger.error("Failed to parse uniform value:", error)
    }
  }

  // Remove custom uniform
  function removeUniform(name: string) {
    delete customUniforms[name]
    customUniforms = { ...customUniforms }
  }

  // Save canvas as PNG
  async function saveAsPNG() {
    if (!canvasElement || !localShaderManager.renderer) return

    try {
      // Ensure a fresh frame is rendered before capturing
      localShaderManager.renderer.renderSingleFrame()

      // Wait for the render to complete
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

      const dataURL = canvasElement.toDataURL("image/png")
      const link = document.createElement("a")
      const suffix = inverted ? "-inverted" : ""
      link.download = `shader-${selectedShader}${suffix}-${canvasWidth}x${canvasHeight}.png`
      link.href = dataURL
      link.click()

      logger.log(`Saved ${selectedShader} as PNG`)
    } catch (error) {
      logger.error("Failed to save PNG:", error)
    }
  }

  // Password handling
  function checkPassword() {
    if (passwordInput === PASSWORD) {
      isAuthenticated = true
      passwordError = false
      localStorage.setItem("shader-showcase-auth", "true")
    } else {
      passwordError = true
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      checkPassword()
    }
  }

  // Watch for shader or size changes
  $effect(() => {
    // Track dependencies: canvasElement, selectedShader, canvasWidth, canvasHeight, inverted, customUniforms
    if (canvasElement) {
      // Access the state variables to make them reactive dependencies
      const shader = selectedShader
      const width = canvasWidth
      const height = canvasHeight
      const inv = inverted
      const uniforms = customUniforms

      renderCurrentShader()
    }
  })

  onMount(() => {
    // Check if already authenticated
    const auth = localStorage.getItem("shader-showcase-auth")
    if (auth === "true") {
      isAuthenticated = true
    }
  })

  onDestroy(() => {
    localShaderManager.destroy()
  })
</script>

{#if !isAuthenticated}
  <div class="password-gate">
    <div class="password-card">
      <h1>Shader Showcase</h1>
      <p>Enter password to access</p>
      <input
        type="password"
        bind:value={passwordInput}
        onkeydown={handleKeydown}
        placeholder="Password"
        class:error={passwordError}
      />
      {#if passwordError}
        <p class="error-message">Incorrect password</p>
      {/if}
      <button onclick={checkPassword}>Unlock</button>
    </div>
  </div>
{:else}
  <div class="showcase">
    <h1>Shader Showcase</h1>

    <div class="controls">
      <div class="control-group">
        <label for="shader-select">Shader:</label>
        <select id="shader-select" bind:value={selectedShader}>
          {#each shaderKeys as key}
            <option value={key}>{key}</option>
          {/each}
        </select>
      </div>

      <div class="control-group">
        <label for="preset-select">Size Preset:</label>
        <select
          id="preset-select"
          bind:value={selectedPreset}
          onchange={() => applyPreset(selectedPreset)}
        >
          {#each presets as preset}
            <option value={preset.name}>{preset.name}</option>
          {/each}
        </select>
      </div>

      <div class="control-group">
        <label for="width-input">Width:</label>
        <input
          id="width-input"
          type="number"
          bind:value={canvasWidth}
          min="100"
          max="4096"
          step="1"
          oninput={() => {
            selectedPreset = "Custom"
          }}
        />
      </div>

      <div class="control-group">
        <label for="height-input">Height:</label>
        <input
          id="height-input"
          type="number"
          bind:value={canvasHeight}
          min="100"
          max="4096"
          step="1"
          oninput={() => {
            selectedPreset = "Custom"
          }}
        />
      </div>

      <div class="control-group checkbox-group">
        <label>
          <input type="checkbox" bind:checked={inverted} />
          Invert
        </label>
      </div>

      <div class="control-group checkbox-group">
        <label>
          <input type="checkbox" bind:checked={customUniformEnabled} />
          Custom Uniforms
        </label>
      </div>

      <button onclick={saveAsPNG} disabled={isRendering}>
        {isRendering ? "Rendering..." : "Save as PNG"}
      </button>
    </div>

    {#if customUniformEnabled}
      <div class="uniforms-section">
        <h2>Custom Uniforms</h2>

        <div class="uniform-form">
          <input type="text" bind:value={uniformName} placeholder="Uniform name (e.g., u_color)" />
          <select bind:value={uniformType}>
            <option value="float">float</option>
            <option value="vec2">vec2</option>
            <option value="vec3">vec3</option>
            <option value="vec4">vec4</option>
            <option value="int">int</option>
            <option value="bool">bool</option>
          </select>
          <input
            type="text"
            bind:value={uniformValue}
            placeholder={uniformType === "float" || uniformType === "int"
              ? "Value (e.g., 0.5)"
              : uniformType === "bool"
                ? "true or false"
                : "Values (e.g., 1.0, 0.5, 0.2)"}
          />
          <button onclick={addCustomUniform}>Add</button>
        </div>

        {#if Object.keys(customUniforms).length > 0}
          <div class="uniform-list">
            {#each Object.entries(customUniforms) as [name, uniform]}
              <div class="uniform-item">
                <span class="uniform-name">{name}</span>
                <span class="uniform-type">{uniform.type}</span>
                <span class="uniform-value">{JSON.stringify(uniform.value)}</span>
                <button class="remove-btn" onclick={() => removeUniform(name)}>×</button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <div class="canvas-container" style="width: {canvasWidth}px; height: {canvasHeight}px;">
      <canvas bind:this={canvasElement} class="shader-canvas"></canvas>
    </div>
  </div>
{/if}

<style lang="scss">
  .password-gate {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: var(--background, #000);
    z-index: 9999;
  }

  .password-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 2rem;
    max-width: 400px;
    width: 100%;
    text-align: center;
    position: relative;
    z-index: 10000;

    h1 {
      margin-bottom: 0.5rem;
      font-size: 1.5rem;
      font-weight: 600;
    }

    p {
      margin-bottom: 1.5rem;
      opacity: 0.8;
      font-size: 0.875rem;
    }

    input[type="password"] {
      width: 100%;
      padding: 0.75rem;
      margin-bottom: 1rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: inherit;
      font-family: inherit;
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
      }

      &.error {
        border-color: rgba(255, 50, 50, 0.6);
      }
    }

    .error-message {
      color: rgba(255, 100, 100, 1);
      font-size: 0.875rem;
      margin-top: -0.5rem;
      margin-bottom: 1rem;
    }

    button {
      width: 100%;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: inherit;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
      }
    }
  }

  .showcase {
    position: relative;
    padding: 2rem;
    max-width: 100%;
    overflow-x: auto;
    z-index: 10;
    min-height: 100vh;
    background: var(--background, #000);
  }

  h1 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    position: relative;
    z-index: 20;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    align-items: center;
    position: relative;
    z-index: 20;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    label {
      font-size: 0.875rem;
      font-weight: 500;
      opacity: 0.8;
    }

    select,
    input:not([type="checkbox"]) {
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: inherit;
      font-family: inherit;
      font-size: 0.875rem;

      &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
      }
    }

    input[type="number"] {
      width: 100px;
    }

    select {
      min-width: 150px;
    }

    &.checkbox-group {
      justify-content: center;

      label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        user-select: none;

        input[type="checkbox"] {
          cursor: pointer;
          width: 16px;
          height: 16px;
        }
      }
    }
  }

  button {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: inherit;
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    align-self: flex-end;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .uniforms-section {
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    position: relative;
    z-index: 20;

    h2 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
  }

  .uniform-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;

    input,
    select {
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: inherit;
      font-family: inherit;
      font-size: 0.875rem;
      flex: 1;
      min-width: 120px;

      &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
      }
    }

    button {
      padding: 0.5rem 1rem;
      white-space: nowrap;
    }
  }

  .uniform-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .uniform-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    font-size: 0.875rem;

    .uniform-name {
      font-weight: 600;
      color: rgba(100, 200, 255, 1);
    }

    .uniform-type {
      padding: 0.125rem 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      font-size: 0.75rem;
      font-family: monospace;
    }

    .uniform-value {
      flex: 1;
      font-family: monospace;
      opacity: 0.8;
    }

    .remove-btn {
      padding: 0.25rem 0.5rem;
      font-size: 1.25rem;
      line-height: 1;
      background: rgba(255, 50, 50, 0.2);
      border-color: rgba(255, 50, 50, 0.4);

      &:hover {
        background: rgba(255, 50, 50, 0.4);
        border-color: rgba(255, 50, 50, 0.6);
      }
    }
  }

  .canvas-container {
    /* Fixed size prevents layout shift */
    position: relative;
    margin: 0 auto;
    background: #000;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
    z-index: 15;
  }

  .shader-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
