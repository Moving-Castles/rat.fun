<script lang="ts">
  import { getModalState } from "./state.svelte"
  let { modal } = getModalState()

  let modalBackground = $state<HTMLDivElement | undefined>(undefined)

  const onModalClick = (e: MouseEvent) => {
    if (e.target === modalBackground && !modal.config?.noclose) {
      modal.close()
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") modal.close()
  }
</script>

<svelte:window onkeydown={onKeyDown} />

{#if modal.show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div id={modal.config.target} bind:this={modalBackground} onclick={onModalClick} class="modal">
    <div class="content" class:fullscreen={modal.config.fullscreen}>
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
    z-index: var(--z-high);
    width: 100dvw;
    height: 100dvh;

    &#roomresult {
      position: absolute;
    }

    .content {
      position: relative;
      z-index: 1;
      overflow-x: hidden;
      overflow-y: scroll;

      // &.fullscreen {
      //   width: 100%;
      //   height: 100%;
      // }
    }
  }
</style>
