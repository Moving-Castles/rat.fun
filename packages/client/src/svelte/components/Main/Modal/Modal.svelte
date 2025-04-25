<script lang="ts">
  import { getModalState } from "./state.svelte"
  let { modal } = getModalState()

  let modalBackground = $state<HTMLDivElement | undefined>(undefined)

  const onModalClick = (e: MouseEvent) => {
    if (e.target === modalBackground && !modal.config?.noclose) {
      modal.close()
    }
  }
</script>

{#if modal.show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div bind:this={modalBackground} onclick={onModalClick} class="modal">
    <div class="content">
      {@render modal.current?.()}
    </div>
  </div>
{/if}

<style lang="scss">
  .modal {
    background: rgba(0, 0, 0, 0.8);
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    overscroll-behavior: none;
    z-index: 10;

    .content {
      width: 700px;
      min-height: 500px;
      max-width: calc(var(--game-window-height) * 0.6);
      max-height: calc(var(--game-window-height) * 0.9);
      overflow-x: hidden;
      overflow-y: scroll;
    }
  }
</style>
