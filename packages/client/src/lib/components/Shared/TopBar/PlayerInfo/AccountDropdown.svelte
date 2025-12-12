<script lang="ts">
  import { fade } from "svelte/transition"
  import MainDropdownContent from "./MainDropdownContent.svelte"
  import DebugDropdownContent from "./DebugDropdownContent.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let showDebug = $state(false)

  const toggleDebug = () => {
    showDebug = !showDebug
  }
</script>

<div class="account-dropdown" out:fade={{ duration: 200 }}>
  {#if window.location.hostname === "testing-rat-fun.netlify.app"}
    <div class="debug-button">
      <button onclick={toggleDebug}>{UI_STRINGS.debug}</button>
    </div>
  {/if}
  {#if showDebug}
    <DebugDropdownContent />
  {:else}
    <MainDropdownContent />
  {/if}
</div>

<style lang="scss">
  .account-dropdown {
    position: fixed;
    top: 58px;
    left: 0;
    background-color: var(--background-dark-transparent);
    color: var(--foreground);
    padding: 20px;
    transition: all 0.2s ease;
    line-height: 1.3em;
    z-index: 1;
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    font-size: var(--font-size-normal);
    font-family: var(--special-font-stack);
    z-index: 2000;
    border: 1px solid var(--color-border);
    width: 600px;
    @media (max-width: 800px) {
      width: 100%;
    }

    .debug-button {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      justify-content: flex-end;

      button {
        width: auto;
        opacity: 0.5;

        &:hover {
          opacity: 1;
        }
      }
    }
  }
</style>
