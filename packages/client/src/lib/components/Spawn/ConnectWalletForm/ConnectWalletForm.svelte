<script lang="ts">
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { sessionClient, isSessionReady, wagmiConfig } from "$lib/modules/entry-kit"
  import { connect, getConnectors } from "@wagmi/core"
  import { get } from "svelte/store"
  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"

  const { walletType, onComplete = () => {} } = $props<{
    walletType: WALLET_TYPE
    onComplete: () => void
  }>()

  let buttonElement: HTMLDivElement | null = $state(null)
  let showWalletSelect = $state(false)
  let connecting = $state(false)
  let settingUp = $state(false)
  let availableConnectors = $state<Array<{ id: string; name: string }>>([])

  const timeline = gsap.timeline()

  // Preferred wallet order (case-insensitive matching)
  const PREFERRED_WALLET_ORDER = ["metamask", "phantom", "rabby", "coinbase"]

  /**
   * Get the sort priority for a connector based on preferred order
   * Returns index in preferred list, or high number if not in list
   */
  function getWalletPriority(connector: { id: string; name: string }): number {
    const searchTerm = `${connector.id} ${connector.name}`.toLowerCase()

    for (let i = 0; i < PREFERRED_WALLET_ORDER.length; i++) {
      if (searchTerm.includes(PREFERRED_WALLET_ORDER[i])) {
        return i
      }
    }

    // Not in preferred list, send to bottom
    return 9999
  }

  // Watch for session to become ready
  $effect(() => {
    if ($sessionClient && $isSessionReady) {
      // Session is ready, complete the flow
      showWalletSelect = false
      onComplete()
    }
  })

  async function connectWallet(connectorId: string) {
    console.log("connectWallet", connectorId)
    const config = get(wagmiConfig)
    if (!config) return

    try {
      connecting = true

      // Find the connector by ID
      const connectors = getConnectors(config)
      const connector = connectors.find(c => c.id === connectorId)

      if (!connector) {
        console.error("Connector not found:", connectorId)
        return
      }

      // Connect wallet via wagmi
      await connect(config, { connector, chainId: config.chains[0].id })

      // Wagmi account watcher in EntryKit.svelte will handle the rest
      showWalletSelect = false
    } catch (error) {
      console.error("Connection failed:", error)
    } finally {
      connecting = false
    }
  }

  function openWalletSelect() {
    // Get available connectors when opening the modal
    const config = get(wagmiConfig)
    if (config) {
      const connectors = getConnectors(config)
      // Filter out the generic "Injected" connector - only show specific wallets
      availableConnectors = connectors
        .filter(c => c.id !== "injected" && c.name !== "Injected")
        .map(c => ({
          id: c.id,
          name: c.name
        }))
        .sort((a, b) => getWalletPriority(a) - getWalletPriority(b))
      console.log("Available connectors:", availableConnectors)
    }
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
        {#if connecting || settingUp}
          <BigButton
            text={connecting ? "Connecting..." : "Setting up..."}
            disabled={true}
            onclick={() => {}}
          />
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
</style>
