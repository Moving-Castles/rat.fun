<script lang="ts">
  import type { ConnectorInfo } from "$lib/modules/drawbridge"
  import { SmallButton } from "$lib/components/Shared"

  let {
    show = $bindable(false),
    connectors,
    connecting,
    onSelect
  }: {
    show: boolean
    connectors: ConnectorInfo[]
    connecting: boolean
    onSelect: (connectorId: string) => void
  } = $props()
</script>

{#if show}
  <div class="wallet-modal">
    <div class="modal-content">
      <button class="close-btn" onclick={() => (show = false)}>×</button>
      <h2>Connect Wallet</h2>
      {#if connectors.length > 0}
        <div class="wallet-options">
          {#each connectors as connector}
            <div class="button-container">
              <SmallButton
                text={connector.name}
                onclick={() => onSelect(connector.id)}
                disabled={connecting}
              />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  .wallet-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
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
        font-size: 32px;
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
        font-size: 24px;
        text-align: center;
      }

      .wallet-options {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .button-container {
          height: 50px;
        }
      }
    }
  }
</style>
