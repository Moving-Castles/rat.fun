<script lang="ts">
  import { fade } from "svelte/transition"
  import MainDropdownContent from "./MainDropdownContent.svelte"
  import DebugDropdownContent from "./DebugDropdownContent.svelte"

  let showDebug = $state(false)

  const toggleDebug = () => {
    showDebug = !showDebug
  }
</script>

<div class="account-dropdown" out:fade={{ duration: 200 }}>
  <div class="debug-button">
    <button onclick={toggleDebug}>Debug</button>
  </div>
  {#if showDebug}
    <DebugDropdownContent />
  {:else}
    <MainDropdownContent />
  {/if}
</div>

<style lang="scss">
  .account-dropdown {
    position: fixed;
    top: 60px;
    left: 0;
    width: 600px;
    background-color: var(--background-semi-transparent);
    color: var(--white);
    padding: 20px;
    transition: all 0.2s ease;
    line-height: 1.3em;
    z-index: 1;
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    font-size: var(--font-size-normal);
    font-family: var(--special-font-stack);
    z-index: 99;
    border: 1px solid var(--color-border);

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
