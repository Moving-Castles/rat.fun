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

  const timeline = gsap.timeline()

  // Watch for session to become ready
  $effect(() => {
    if ($sessionClient && $isSessionReady) {
      // Session is ready, complete the flow
      showWalletSelect = false
      onComplete()
    }
  })

  async function connectWallet(connectorId?: string) {
    console.log("connectWallet", connectorId)
    const config = get(wagmiConfig)
    if (!config) return

    console.log("config", config)

    try {
      connecting = true

      // If no connector specified, try to auto-detect injected wallet
      const connectors = getConnectors(config)
      const connector = connectorId
        ? connectors.find(c => c.id === connectorId)
        : connectors.find(c => c.type === "injected")

      if (!connector) {
        console.error("No wallet connector found")
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
              <button
                class="wallet-option"
                onclick={() => connectWallet("io.metamask")}
                disabled={connecting}
              >
                MetaMask
              </button>
              <button
                class="wallet-option"
                onclick={() => connectWallet("com.coinbase.wallet")}
                disabled={connecting}
              >
                Coinbase Wallet
              </button>
              <button
                class="wallet-option"
                onclick={() => connectWallet("walletConnect")}
                disabled={connecting}
              >
                WalletConnect
              </button>
              <button class="wallet-option" onclick={() => connectWallet()} disabled={connecting}>
                Browser Wallet
              </button>
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
