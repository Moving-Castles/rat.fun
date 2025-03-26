<script lang="ts">
  import { getModalState } from "./state.svelte"
  let { modal } = getModalState()
  let modalBackground = $state(undefined)

  const onModalClick = e => {
    if (e.target === modalBackground && !modal.config?.noclose) {
      modal.close()
    }
    console.log(e.target, modalBackground)
  }

  $inspect(modal.show)
</script>

{#if modal.show}
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
  }

  .content {
    width: 600px;
    height: 400px;
    overflow-x: hidden;
    overflow-y: scroll;
  }
</style>
