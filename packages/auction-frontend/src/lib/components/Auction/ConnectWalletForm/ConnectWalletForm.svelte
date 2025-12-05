<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { getDrawbridge, type ConnectorInfo } from "$lib/modules/drawbridge"
  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"

  let buttonElement: HTMLDivElement | null = $state(null)
  let showWalletSelect = $state(false)
  let connecting = $state(false)
  let availableConnectors = $state<ConnectorInfo[]>([])

  const timeline = gsap.timeline()

  // Preferred wallet order (case-insensitive matching)
  const PREFERRED_WALLET_ORDER = ["metamask", "phantom", "rabby", "coinbase"]

  /**
   * Get the sort priority for a connector based on preferred order
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

      // Wallet connected - close modal
      showWalletSelect = false
    } catch (error) {
      console.error("[ConnectWalletForm] Connection failed:", error)
    } finally {
      connecting = false
    }
  }

  function openWalletSelect() {
    // Get available connectors from drawbridge
    const drawbridge = getDrawbridge()
    const connectors = drawbridge.getAvailableConnectors()

    // Filter out the generic "Injected" connector - only show specific wallets
    // UNLESS it's the only connector (like in Base app mobile browser)
    const filteredConnectors = connectors.filter(c => c.id !== "injected" && c.name !== "Injected")

    // If we have specific wallets, use those. Otherwise, keep the injected connector.
    availableConnectors =
      filteredConnectors.length > 0
        ? filteredConnectors.sort((a, b) => getWalletPriority(a) - getWalletPriority(b))
        : connectors

    console.log("[ConnectWalletForm] Available connectors:", $state.snapshot(availableConnectors))

    // If only one connector available, auto-connect to it
    if (availableConnectors.length === 1) {
      console.log("[ConnectWalletForm] Only one connector available, auto-connecting")
      connectWallet(availableConnectors[0].id)
      showWalletSelect = true
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
</style>
