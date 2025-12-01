<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { getDrawbridge, type ConnectorInfo, drawbridgeError } from "$lib/modules/drawbridge"
  import { debugInfo } from "$lib/modules/drawbridge/wagmiConfig"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"
  import { errorHandler } from "$lib/modules/error-handling"

  let buttonElement: HTMLDivElement | null = $state(null)

  let connecting = $state(false)

  let showDebugPanel = $state(false)
  let showWalletSelect = $state(false)
  let showNoWalletsModal = $state(false)
  let showDeepLinkSelect = $state(false)

  let availableConnectors = $state<ConnectorInfo[]>([])
  let allConnectors = $state<ConnectorInfo[]>([])

  const timeline = gsap.timeline()

  const PREFERRED_WALLET_ORDER = ["metamask", "phantom", "rabby", "coinbase"]

  const WALLET_DEEPLINKS: Record<string, { ios: string; android: string; name: string }> = {
    coinbase: {
      ios: "https://go.cb-w.com/dapp?cb_url=https%3A%2F%2Frat.fun",
      android: "https://go.cb-w.com/dapp?cb_url=https%3A%2F%2Frat.fun",
      name: "BASE"
    },
    metamask: {
      ios: "https://metamask.app.link/dapp/rat.fun",
      android: "https://metamask.app.link/dapp/rat.fun",
      name: "MetaMask"
    },
    phantom: {
      ios: "https://phantom.app/ul/browse/https%3A%2F%2Frat.fun",
      android: "https://phantom.app/ul/browse/https%3A%2F%2Frat.fun",
      name: "Phantom"
    },
    rabby: {
      ios: "rabby://dapp?url=https%3A%2F%2Frat.fun",
      android: "rabby://dapp?url=https%3A%2F%2Frat.fun",
      name: "Rabby"
    }
  }

  function openWalletDeeplink(walletId: string) {
    const deeplink = WALLET_DEEPLINKS[walletId]
    if (!deeplink) return

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const url = isIOS ? deeplink.ios : deeplink.android

    window.location.href = url
  }

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

      const drawbridge = getDrawbridge()
      await drawbridge.connectWallet(connectorId)

      console.log("[ConnectWalletForm] Wallet connected successfully")
      // Account watcher in drawbridge will handle session creation
      // Close modal and transition to SESSION
      showWalletSelect = false
      // !!! HACK: Wait for 1 second to avoid showing flash of SESSION if we are setup
      await new Promise(resolve => setTimeout(resolve, 1000))
      spawnState.state.transitionTo(SPAWN_STATE.SESSION)
    } catch (error) {
      console.error("[ConnectWalletForm] Connection failed:", error)
      errorHandler(error, "Failed to connect wallet")
    } finally {
      connecting = false
    }
  }

  // Watch for async errors from drawbridge (e.g., from account watcher)
  $effect(() => {
    if ($drawbridgeError) {
      console.error("[ConnectWalletForm] Drawbridge error:", $drawbridgeError)
      errorHandler($drawbridgeError, "Wallet connection error")
    }
  })

  function handleClick() {
    // If no connectors available, show the modal with debug panel
    if (availableConnectors.length === 0) {
      console.log("__ no connectors available")
      if ($isPhone) {
        showDeepLinkSelect = true
      } else {
        showNoWalletsModal = true
      }
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

  function prepareConnectors() {
    const drawbridge = getDrawbridge()
    const connectors = drawbridge.getAvailableConnectors()

    // Check if window.ethereum exists
    const hasInjectedProvider =
      typeof window !== "undefined" && typeof window.ethereum !== "undefined"

    console.log("[ConnectWalletForm] Connector setup:", {
      allConnectors: connectors.length,
      hasInjectedProvider
    })

    // Store all connectors for debug panel
    allConnectors = connectors

    // Filter out generic "Injected" connector - only show specific wallets
    const filteredConnectors = connectors.filter(c => c.id !== "injected" && c.name !== "Injected")

    // CRITICAL: If we filtered out all connectors BUT window.ethereum exists,
    // keep injected connector (Base app case)
    if (filteredConnectors.length === 0 && connectors.length > 0 && hasInjectedProvider) {
      console.log(
        "[ConnectWalletForm] No specific wallets but window.ethereum exists - keeping injected"
      )

      // Improve the display name for injected connector
      const injectedConnector = connectors.find(c => c.id === "injected")
      if (injectedConnector) {
        // Try to get provider name from window.ethereum
        let providerName = "Wallet"
        if (window.ethereum) {
          const eth = window.ethereum as any
          if (eth.isCoinbaseWallet) providerName = "BASE Wallet"
          else if (eth.isMetaMask) providerName = "MetaMask"
          else if (eth.isRabby) providerName = "Rabby"
          else if (eth.isPhantom) providerName = "Phantom"
        }

        availableConnectors = [
          {
            id: injectedConnector.id,
            name: providerName,
            type: injectedConnector.type
          }
        ]
      } else {
        availableConnectors = connectors
      }
    } else if (filteredConnectors.length === 0 && !hasInjectedProvider) {
      // No specific wallets AND no window.ethereum - show deep links or no wallets
      console.log("[ConnectWalletForm] No wallets detected")
      availableConnectors = []
    } else {
      // We have specific wallets, use those
      availableConnectors = filteredConnectors.sort(
        (a, b) => getWalletPriority(a) - getWalletPriority(b)
      )
    }

    console.log("[ConnectWalletForm] Final connectors:", availableConnectors)
  }

  onMount(() => {
    console.log("[ConnectWalletForm] Component mounted")

    prepareConnectors()

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
    <div class="button-container" bind:this={buttonElement}>
      {#if connecting}
        <BigButton text="Connecting..." disabled={true} onclick={() => {}} />
      {:else}
        <BigButton text="Connect wallet" onclick={handleClick} />
      {/if}
    </div>

    <!-- No wallets modal -->
    {#if showNoWalletsModal}
      <div class="wallet-modal">
        <div class="modal-content">
          <button class="close-btn" onclick={() => (showNoWalletsModal = false)}>×</button>
          <h2>No wallets found</h2>
          <p>No wallets found. Please install a wallet app to continue.</p>
        </div>
      </div>
    {/if}

    <!-- Wallet select -->
    {#if showWalletSelect}
      <div class="wallet-modal">
        <div class="modal-content">
          <button class="close-btn" onclick={() => (showWalletSelect = false)}>×</button>
          <h2>Connect Wallet</h2>
          {#if availableConnectors.length > 0}
            <div class="wallet-options">
              {#each availableConnectors as connector}
                <button
                  class="wallet-option"
                  onclick={() => connectWallet(connector.id)}
                  disabled={connecting}
                >
                  {connector.name}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Deep link select -->
    {#if showDeepLinkSelect}
      <div class="wallet-modal">
        <div class="modal-content">
          <button class="close-btn" onclick={() => (showDeepLinkSelect = false)}>×</button>
          <h2>Open in wallet app</h2>
          <div class="wallet-options">
            {#each Object.entries(WALLET_DEEPLINKS) as [walletId, wallet]}
              <button class="wallet-option" onclick={() => openWalletDeeplink(walletId)}>
                {wallet.name}
              </button>
            {/each}
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

    <!-- Floating debug button - always visible -->
    <button class="floating-debug-btn" onclick={() => (showDebugPanel = !showDebugPanel)}>
      🐛
    </button>
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
