<script lang="ts">
  import { shaders } from "$lib/modules/webgl/shaders/index.svelte"

  let { onShaderChange, onModeChange } = $props()

  // Props
  let selectedShader = $state("main")
  let selectedMode = $state("introduction") // Default mode for main shader

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

  // Handle shader selection change
  function handleShaderChange(event: Event) {
    const target = event.target as HTMLSelectElement
    selectedShader = target.value

    // Reset to first available mode when shader changes
    selectedMode = availableModes.length > 0 ? availableModes[0] : "default"

    onShaderChange(selectedShader)
    onModeChange(selectedMode)
  }

  // Handle mode selection change
  function handleModeChange(event: Event) {
    const target = event.target as HTMLSelectElement
    selectedMode = target.value
    onModeChange(selectedMode)
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
</style>
