<script lang="ts">
  let { show = $bindable(false) }: { show: boolean } = $props()
</script>

{#if show}
  <div class="wallet-modal">
    <div class="modal-content">
      <button class="close-btn" onclick={() => (show = false)}>×</button>
      <h2>No wallets found</h2>
      <p>No wallets found. Please install a wallet app to continue.</p>
    </div>
  </div>
{/if}

<style lang="scss">
  .wallet-modal {
    position: fixed;
    inset: 0;
    background: var(--background-dark-transparent);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;

    .modal-content {
      background: var(--background);
      color: var(--foreground);
      border: 2px solid var(--foreground);
      padding: 32px;
      max-width: 400px;
      width: 90%;
      position: relative;

      .close-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: transparent;
        color: var(--foreground);
        border: none;
        font-size: var(--font-size-large);
        cursor: pointer;
        line-height: 1;
        padding: 0;
        width: 32px;
        height: 32px;

        &:hover {
          opacity: 0.7;
        }
      }

      h2 {
        margin: 0 0 24px 0;
        font-size: var(--font-size-large);
        text-align: center;
      }
    }
  }
</style>
