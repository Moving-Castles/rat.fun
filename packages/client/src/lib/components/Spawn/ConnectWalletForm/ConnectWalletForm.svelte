<script lang="ts">
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { getEntryKit, type ConnectorInfo } from "$lib/modules/entry-kit"
  import { debugInfo } from "$lib/modules/entry-kit/wagmiConfig"
  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"

  const { walletType, onComplete = () => {} } = $props<{
    walletType: WALLET_TYPE
    onComplete: () => void
  }>()

  let buttonElement: HTMLDivElement | null = $state(null)
  let showWalletSelect = $state(false)
  let connecting = $state(false)
  let availableConnectors = $state<ConnectorInfo[]>([])
  let showDebugPanel = $state(false)
  let allConnectors = $state<ConnectorInfo[]>([])

  const timeline = gsap.timeline()

  // Preferred wallet order (case-insensitive matching)
  const PREFERRED_WALLET_ORDER = ["metamask", "phantom", "rabby", "coinbase"]

  /**
   * Get the sort priority for a connector based on preferred order
   * Returns index in preferred list, or high number if not in list
   */
  function getWalletPriority(connector: ConnectorInfo): number {
    const searchTerm = `${connector.id} ${connector.name}`.toLowerCase()

    for (let i = 0; i < PREFERRED_WALLET_ORDER.length; i++) {
      if (searchTerm.includes(PREFERRED_WALLET_ORDER[i])) {
        return i
      }
    }

    // Not in preferred list, send to bottom
    return 9999
  }

  async function connectWallet(connectorId: string) {
    console.log("[ConnectWalletForm] Connecting to:", connectorId)

    try {
      connecting = true

      const entrykit = getEntryKit()
      await entrykit.connectWallet(connectorId)

      // Account watcher in EntryKit will handle session creation
      // Close modal and complete this step
      showWalletSelect = false
      onComplete()
    } catch (error) {
      console.error("[ConnectWalletForm] Connection failed:", error)
    } finally {
      connecting = false
    }
  }

  function openWalletSelect() {
    // Get available connectors from EntryKit
    const entrykit = getEntryKit()
    const connectors = entrykit.getAvailableConnectors()

    // Store all connectors for debug panel
    allConnectors = connectors

    // Filter out the generic "Injected" connector - only show specific wallets
    // UNLESS it's the only connector (like in Base app mobile browser)
    const filteredConnectors = connectors.filter(c => c.id !== "injected" && c.name !== "Injected")

    // If we have specific wallets, use those. Otherwise, keep the injected connector.
    availableConnectors =
      filteredConnectors.length > 0
        ? filteredConnectors.sort((a, b) => getWalletPriority(a) - getWalletPriority(b))
        : connectors

    // Improve the display name for generic "Injected" connector based on detected provider
    if (availableConnectors.length === 1 && availableConnectors[0].id === "injected") {
      if (debugInfo.windowEthereumProviders.length > 0) {
        // Use detected provider name instead of "Injected"
        const providerName = debugInfo.windowEthereumProviders[0]
        availableConnectors = [
          {
            id: availableConnectors[0].id,
            name: providerName === "Coinbase" ? "Coinbase Wallet" : providerName,
            type: availableConnectors[0].type
          }
        ]
      }
    }

    console.log("[ConnectWalletForm] All connectors:", allConnectors)
    console.log("[ConnectWalletForm] Available connectors:", availableConnectors)

    // If no connectors at all, show modal with debug panel
    if (allConnectors.length === 0) {
      showWalletSelect = true
      showDebugPanel = true
      return
    }

    // If only one connector available, auto-connect to it
    if (availableConnectors.length === 1) {
      console.log("[ConnectWalletForm] Only one connector available, auto-connecting")
      connectWallet(availableConnectors[0].id)
      return
    }

    // Otherwise show the modal for user to choose
    showWalletSelect = true
  }

  onMount(() => {
    if (!buttonElement) {
      return
    }

    // Set initial opacity to 0
    buttonElement.style.opacity = "0"

    // Animate opacity to 1
    if (buttonElement) {
      timeline.to(buttonElement, {
        opacity: 1,
        duration: 0.4
      })
    }
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    {#if walletType === WALLET_TYPE.ENTRYKIT}
      <div class="button-container" bind:this={buttonElement}>
        {#if connecting}
          <BigButton text="Connecting..." disabled={true} onclick={() => {}} />
        {:else}
          <BigButton text="Connect wallet" onclick={openWalletSelect} />
        {/if}
      </div>

      <!-- Simple wallet selection modal -->
      {#if showWalletSelect}
        <div class="wallet-modal">
          <div class="modal-content">
            <button class="close-btn" onclick={() => (showWalletSelect = false)}>×</button>
            <h2>Connect Wallet</h2>
            <div class="wallet-options">
              {#if availableConnectors.length > 0}
                {#each availableConnectors as connector}
                  <button
                    class="wallet-option"
                    onclick={() => connectWallet(connector.id)}
                    disabled={connecting}
                  >
                    {connector.name}
                  </button>
                {/each}
              {:else}
                <p class="no-wallets">No wallet connectors available</p>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Debug panel -->
      {#if showDebugPanel}
        <div class="debug-panel">
          <div class="debug-content">
            <button class="close-btn" onclick={() => (showDebugPanel = false)}>×</button>
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
                <strong>Available from EntryKit:</strong>
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

      <!-- Floating debug button - always visible -->
      <button class="floating-debug-btn" onclick={() => (showDebugPanel = !showDebugPanel)}>
        🐛
      </button>
    {:else}
      <div class="button-container" bind:this={buttonElement}>
        <BigButton text="Connect Burner" onclick={onComplete} />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;
    color: var(--background);

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      width: 500px;
      max-width: 90dvw;

      .button-container {
        width: 100%;
        height: 200px;
        margin-bottom: 20px;
      }
    }
  }

  .wallet-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;

    .modal-content {
      background: var(--background);
      color: var(--foreground);
      border: 2px solid var(--foreground);
      border-radius: 8px;
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

        .no-wallets {
          text-align: center;
          color: var(--foreground);
          margin: 16px 0;
          opacity: 0.7;
        }

        .wallet-option {
          background: transparent;
          color: var(--foreground);
          border: 2px solid var(--foreground);
          padding: 16px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;

          &:hover:not(:disabled) {
            background: var(--foreground);
            color: var(--background);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }
  }

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

    &:hover {
      transform: scale(1.1);
    }
  }

  .debug-toggle-btn {
    margin-top: 16px;
    width: 100%;
    background: transparent;
    color: var(--foreground);
    border: 1px solid var(--foreground);
    padding: 8px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    opacity: 0.6;

    &:hover {
      opacity: 1;
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
