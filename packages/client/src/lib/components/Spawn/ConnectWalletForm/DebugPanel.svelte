<script lang="ts">
  import type { ConnectorInfo } from "$lib/modules/drawbridge"
  import { debugInfo } from "$lib/modules/drawbridge/wagmiConfig"

  let {
    show = $bindable(false),
    allConnectors,
    availableConnectors
  }: {
    show: boolean
    allConnectors: ConnectorInfo[]
    availableConnectors: ConnectorInfo[]
  } = $props()
</script>

{#if show}
  <div class="debug-panel">
    <div class="debug-content">
      <button class="close-btn" onclick={() => (show = false)}>×</button>
      <h2>Connection Debug Info</h2>
      <div class="debug-section">
        <h3>Environment</h3>
        <div class="debug-item">
          <strong>User Agent:</strong>
          <span class="debug-value">{debugInfo.userAgent}</span>
        </div>
        <div class="debug-item">
          <strong>Mobile:</strong>
          <span class="debug-value">{debugInfo.isMobile ? "Yes" : "No"}</span>
        </div>
        <div class="debug-item">
          <strong>Base App:</strong>
          <span class="debug-value">{debugInfo.isBaseApp ? "Yes" : "No"}</span>
        </div>
        <div class="debug-item">
          <strong>Coinbase Wallet:</strong>
          <span class="debug-value">{debugInfo.isCoinbaseWallet ? "Yes" : "No"}</span>
        </div>
        <div class="debug-item">
          <strong>In iframe:</strong>
          <span class="debug-value">{debugInfo.isInIframe ? "Yes" : "No"}</span>
        </div>
        <div class="debug-item">
          <strong>Timestamp:</strong>
          <span class="debug-value">{debugInfo.timestamp}</span>
        </div>
      </div>
      <div class="debug-section">
        <h3>Window.ethereum</h3>
        <div class="debug-item">
          <strong>Exists:</strong>
          <span class="debug-value">{debugInfo.hasWindowEthereum ? "Yes" : "No"}</span>
        </div>
        {#if debugInfo.hasWindowEthereum}
          <div class="debug-item">
            <strong>Providers:</strong>
            <span class="debug-value">
              {debugInfo.windowEthereumProviders.length > 0
                ? debugInfo.windowEthereumProviders.join(", ")
                : "None detected"}
            </span>
          </div>
        {/if}
      </div>
      <div class="debug-section">
        <h3>Connectors</h3>
        <div class="debug-item">
          <strong>Total from getConnectors():</strong>
          <span class="debug-value">{debugInfo.connectorsCount}</span>
        </div>
        <div class="debug-item">
          <strong>Available from drawbridge:</strong>
          <span class="debug-value">{allConnectors.length}</span>
        </div>
        <div class="debug-item">
          <strong>After filtering:</strong>
          <span class="debug-value">{availableConnectors.length}</span>
        </div>
      </div>
      <div class="debug-section">
        <h3>All Connectors Details</h3>
        {#if allConnectors.length > 0}
          {#each allConnectors as connector}
            <div class="debug-item connector-detail">
              <strong>ID:</strong>
              {connector.id}<br />
              <strong>Name:</strong>
              {connector.name}
            </div>
          {/each}
        {:else}
          <p class="debug-warning">No connectors found!</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Floating debug button -->
<button class="floating-debug-btn" onclick={() => (show = !show)}> 🐛 </button>

<style lang="scss">
  .floating-debug-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--foreground);
    color: var(--background);
    border: 2px solid var(--foreground);
    font-size: 24px;
    cursor: pointer;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;
    display: none;

    &:hover {
      transform: scale(1.1);
    }
  }

  .debug-panel {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 10000;
    overflow-y: auto;
    padding: 20px;

    .debug-content {
      background: var(--background);
      color: var(--foreground);
      border: 2px solid var(--foreground);
      border-radius: 8px;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
      position: relative;
      font-size: 12px;

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
        font-size: 20px;
        text-align: center;
      }

      h3 {
        margin: 16px 0 8px 0;
        font-size: 14px;
        border-bottom: 1px solid var(--foreground);
        padding-bottom: 4px;
      }

      .debug-section {
        margin-bottom: 20px;
      }

      .debug-item {
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        word-break: break-all;

        strong {
          display: inline-block;
          min-width: 120px;
        }

        .debug-value {
          opacity: 0.8;
        }

        &.connector-detail {
          background: rgba(255, 255, 255, 0.05);
          padding: 12px;
          margin: 8px 0;
          border-radius: 4px;
        }
      }

      .debug-warning {
        color: #ff6b6b;
        text-align: center;
        font-weight: bold;
        margin: 16px 0;
      }
    }
  }
</style>
