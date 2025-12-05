<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { getDrawbridge, type ConnectorInfo, drawbridgeError } from "$lib/modules/drawbridge"
  import { debugInfo } from "$lib/modules/drawbridge/getConnectors"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import { BigButton, Mascot } from "$lib/components/Shared"
  import { spawnState, determineNextState } from "$lib/components/Spawn/state.svelte"
  import { buildFlowContext } from "$lib/components/Spawn/flowContext"
  import { errorHandler } from "$lib/modules/error-handling"
  import { publicNetwork } from "$lib/modules/network"
  import { setupWalletNetwork } from "@ratfun/common/mud"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { WALLET_TYPE } from "@ratfun/common/basic-network"
  import { initEntities, isEntitiesInitialized } from "$lib/modules/chain-sync"
  import { addressToId } from "$lib/modules/utils"
  import { connectWalletFormMascotText } from "./connectWalletFormMascotText"
  import NoWalletsModal from "./NoWalletsModal.svelte"
  import WalletSelectModal from "./WalletSelectModal.svelte"
  import DeepLinkSelectModal from "./DeepLinkSelectModal.svelte"
  import DebugPanel from "./DebugPanel.svelte"

  let mascotElement: HTMLDivElement | null = $state(null)
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

  const buttonText = "PROVE OPERATOR IDENTITY"

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

      // Wait briefly for stores to update after wallet connection
      await new Promise(resolve => setTimeout(resolve, 500))

      // Initialize wallet network if session is ready
      // (returning user with existing session in localStorage)
      const state = drawbridge.getState()
      if (state.sessionClient && state.userAddress) {
        console.log("[ConnectWalletForm] Session ready, initializing wallet network")
        const wallet = setupWalletNetwork($publicNetwork, state.sessionClient)
        initWalletNetwork(wallet, state.userAddress, WALLET_TYPE.DRAWBRIDGE)

        // Initialize entities if not already done (Scenario C users)
        // This populates externalAddressesConfig needed for allowance check
        if (!isEntitiesInitialized()) {
          const playerId = addressToId(state.userAddress)
          console.log("[ConnectWalletForm] Initializing entities for player:", playerId)
          await initEntities({ activePlayerId: playerId })
        }
      }

      // Determine next state based on current context
      const context = await buildFlowContext()
      const nextState = determineNextState(context)

      console.log("[ConnectWalletForm] Flow context:", context)
      console.log("[ConnectWalletForm] Next state:", nextState)

      spawnState.state.transitionTo(nextState)
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

    if (!mascotElement || !buttonElement) {
      return
    }

    gsap.set([mascotElement, buttonElement], { opacity: 0 })

    timeline
      .to(mascotElement, { opacity: 1, duration: 0.4 }, "0")
      .to(buttonElement, { opacity: 1, duration: 0.4 }, "0.2")
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    <div class="mascot-container" bind:this={mascotElement}>
      <Mascot text={connectWalletFormMascotText} finishTextOnClick={true} />
    </div>

    <div class="button-container" bind:this={buttonElement}>
      {#if connecting}
        <BigButton text="Connecting..." disabled={true} onclick={() => {}} />
      {:else}
        <BigButton text={buttonText} onclick={handleClick} />
      {/if}
    </div>

    <NoWalletsModal bind:show={showNoWalletsModal} />

    <WalletSelectModal
      bind:show={showWalletSelect}
      connectors={availableConnectors}
      {connecting}
      onSelect={connectWallet}
    />

    <DeepLinkSelectModal bind:show={showDeepLinkSelect} />

    <DebugPanel bind:show={showDebugPanel} {allConnectors} {availableConnectors} />
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
      width: var(--spawn-inner-width);
      max-width: 90dvw;

      .mascot-container {
        width: var(--spawn-mascot-size);
        height: var(--spawn-mascot-size);
        margin-bottom: var(--spawn-mascot-margin-bottom);
        pointer-events: none;
      }

      .button-container {
        width: 100%;
        height: var(--spawn-button-height);
      }
    }
  }
</style>
