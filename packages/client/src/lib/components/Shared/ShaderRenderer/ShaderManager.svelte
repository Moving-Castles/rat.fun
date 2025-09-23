<script lang="ts">
  import { shaders } from "$lib/modules/webgl/shaders/index.svelte"

  let { onShaderChange, onModeChange, onUniformChange } = $props()

  // Props
  let selectedShader = $state("clouds")
  let selectedMode = $state("") // Default mode for main shader

  // Get shader names and format them for display
  const shaderNames = Object.keys(shaders)
  const formatShaderName = (name: string) => {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  // Get available modes for current shader
  const availableModes = $derived.by(() => {
    const shader = shaders[selectedShader as keyof typeof shaders]
    if (shader?.config?.modes) {
      return Object.keys(shader.config.modes)
    }
    return []
  })

  const getAvailableUniforms = shader => {
    if (shader?.config?.modes && selectedMode) {
      const mode = shader.config.modes[selectedMode]
      if (mode) {
        return Object.entries(mode).map(([name, value]) => ({
          name,
          value: typeof value === "number" ? value : value ? 1 : 0,
          type: typeof value === "boolean" ? "boolean" : "number"
        }))
      }
    }
    return []
  }

  // Get available uniforms for current shader and mode
  let availableUniforms = $state(
    getAvailableUniforms(shaders[selectedShader as keyof typeof shaders])
  )

  // Handle shader selection change
  function handleShaderChange(event: Event) {
    const target = event.target as HTMLSelectElement
    selectedShader = target.value

    // Reset to first available mode when shader changes
    selectedMode = availableModes.length > 0 ? availableModes[0] : "default"

    onShaderChange(selectedShader)
    availableUniforms = getAvailableUniforms(shaders[selectedShader as keyof typeof shaders])
    onModeChange(selectedMode)
  }

  // Handle mode selection change
  function handleModeChange(event: Event) {
    const target = event.target as HTMLSelectElement
    selectedMode = target.value
    availableUniforms = getAvailableUniforms(shaders[selectedShader as keyof typeof shaders])
    onModeChange(selectedMode)
  }

  // Handle uniform value changes
  function handleUniformChange(uniformName: string, value: number | boolean) {
    if (onUniformChange) {
      onUniformChange(uniformName, value)
    }
  }

  // Export current selections for parent component
  export { selectedShader, selectedMode }
</script>

{#if import.meta.env.DEV}
  <div class="shader-manager">
    <div class="control-group">
      <label for="shader-select">Shader:</label>
      <select id="shader-select" bind:value={selectedShader} onchange={handleShaderChange}>
        {#each shaderNames as shaderName}
          <option value={shaderName}>
            {formatShaderName(shaderName)}
          </option>
        {/each}
      </select>
    </div>

    <div class="control-group">
      <label for="mode-select">Mode:</label>
      <select
        id="mode-select"
        bind:value={selectedMode}
        onchange={handleModeChange}
        disabled={availableModes.length === 0}
      >
        {#each availableModes as mode}
          <option value={mode}>
            {formatShaderName(mode)}
          </option>
        {/each}
        {#if availableModes.length === 0}
          <option value="">No modes available</option>
        {/if}
      </select>
    </div>

    {#if availableUniforms.length > 0}
      <div class="uniforms-section">
        <h3>Uniforms</h3>
        {#each availableUniforms as uniform}
          <div class="uniform-control">
            <label for="uniform-{uniform.name}">{formatShaderName(uniform.name)}:</label>
            {#if uniform.type === "boolean"}
              <input
                type="checkbox"
                id="uniform-{uniform.name}"
                checked={uniform.value > 0}
                onchange={e => handleUniformChange(uniform.name, e.target.checked)}
              />
            {:else}
              <div class="number-input-group">
                <input
                  type="range"
                  id="uniform-{uniform.name}"
                  min="-2"
                  max="2"
                  step="0.01"
                  bind:value={uniform.value}
                  oninput={e => handleUniformChange(uniform.name, parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  class="number-input"
                  min="-2"
                  max="2"
                  step="0.01"
                  value={uniform.value}
                  oninput={e => handleUniformChange(uniform.name, parseFloat(e.target.value))}
                />
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  .shader-manager {
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 1000;
    font-size: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.9);
      transform: translateY(-2px);
    }
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 200px;
  }

  label {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    width: 80px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  select {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: white;
    padding: 6px 10px;
    font-size: 13px;
    flex: 1;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    option {
      background: #1a1a1a;
      color: white;
      padding: 4px;
    }
  }

  .uniforms-section {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 12px;
    margin-top: 12px;

    h3 {
      color: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 8px 0;
    }
  }

  .uniform-control {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;

    label {
      font-size: 11px;
      width: auto;
      color: rgba(255, 255, 255, 0.7);
    }

    input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .number-input-group {
      display: flex;
      gap: 6px;
      align-items: center;

      input[type="range"] {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        height: 4px;
        border-radius: 2px;
        outline: none;
        cursor: pointer;

        &::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
        }

        &::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
        }
      }

      .number-input {
        width: 60px;
        padding: 2px 4px;
        font-size: 11px;
        text-align: center;
      }
    }
  }
</style>
