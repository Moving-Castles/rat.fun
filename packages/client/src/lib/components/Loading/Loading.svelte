<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { page } from "$app/state"
  import { get } from "svelte/store"
  import { initPublicNetwork } from "$lib/initPublicNetwork"
  import { initEntities } from "$lib/modules/chain-sync"
  import { terminalTyper } from "$lib/modules/terminal-typer/index"
  import { generateLoadingOutput } from "$lib/components/Loading/loadingOutput"
  import { playSound } from "$lib/modules/sound"
  import {
    blockNumber,
    loadingMessage,
    loadingPercentage,
    ready,
    publicNetwork,
    walletType as walletTypeStore
  } from "$lib/modules/network"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { addressToId } from "$lib/modules/utils"

  import { ENVIRONMENT, WALLET_TYPE } from "$lib/mud/enums"
  import { gsap } from "gsap"

  // Wallet setup imports
  import { setupBurnerWalletNetwork } from "$lib/mud/setupBurnerWalletNetwork"
  import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
  import {
    initializeDrawbridge,
    getDrawbridge,
    getDrawbridgePublicClient
  } from "$lib/modules/drawbridge"

  const {
    environment,
    loaded = () => {}
  }: {
    environment: ENVIRONMENT
    loaded: () => void
  } = $props()

  let typer = $state<{ stop: () => void }>()

  // Elements
  let loadingElement: HTMLDivElement
  let terminalBoxElement: HTMLDivElement
  let logoElement: HTMLDivElement

  // ============================================================================
  // ASYNC HELPERS
  // ============================================================================

  /**
   * Initialize drawbridge if in DRAWBRIDGE mode.
   * Returns the public client from drawbridge's wagmi config to reuse for MUD sync.
   * This avoids double RPC polling.
   */
  async function initDrawbridgeIfNeeded() {
    const walletType = get(walletTypeStore)

    if (walletType !== WALLET_TYPE.DRAWBRIDGE) {
      return undefined
    }

    console.log("[Loading] Initializing drawbridge before MUD sync...")
    const networkConfig = getNetworkConfig(environment, page.url)
    await initializeDrawbridge(networkConfig)

    // Get the public client from drawbridge to reuse for MUD sync
    const publicClient = getDrawbridgePublicClient()
    console.log("[Loading] Got public client from drawbridge")

    return publicClient
  }

  /**
   * Get player ID from wallet if connected.
   * For DRAWBRIDGE: drawbridge is already initialized, just check state.
   * For BURNER: initialize burner wallet using MUD's public network.
   */
  function getPlayerIdFromWallet(): string | null {
    const walletType = get(walletTypeStore)

    if (walletType === WALLET_TYPE.BURNER) {
      const network = get(publicNetwork)
      const wallet = setupBurnerWalletNetwork(network)
      const address = wallet.walletClient?.account?.address
      if (address) {
        const playerId = addressToId(address)
        console.log("[Loading] Burner wallet found:", playerId)
        return playerId
      }
      console.log("[Loading] No burner wallet")
      return null
    }

    if (walletType === WALLET_TYPE.DRAWBRIDGE) {
      const drawbridge = getDrawbridge()
      const address = drawbridge.getState().userAddress
      if (address) {
        const playerId = addressToId(address)
        console.log("[Loading] Drawbridge session found:", playerId)
        return playerId
      }
      console.log("[Loading] No drawbridge session")
      return null
    }

    return null
  }

  // ============================================================================
  // ANIMATION
  // ============================================================================

  const strobeColors = ["#ff0000", "#00ff00", "#0000ff"]

  function animateOut(): Promise<void> {
    return new Promise(resolve => {
      const tl = gsap.timeline()

      tl.to(terminalBoxElement, {
        opacity: 0,
        duration: 0
      })

      tl.call(() => {
        playSound({ category: "ratfunUI", id: "strobe" })
      })

      // Create strobe effect: 16 cycles of 1/60s (1 frame each at 60fps)
      for (let i = 0; i < 16; i++) {
        tl.to(loadingElement, {
          background: strobeColors[i % strobeColors.length],
          duration: 0,
          delay: 1 / 60
        })
        tl.to(loadingElement, {
          background: "transparent",
          duration: 0,
          delay: 1 / 60
        })
      }

      tl.to(logoElement, {
        opacity: 1,
        duration: 0,
        delay: 0
      })

      tl.to(loadingElement, {
        background: "black",
        duration: 0,
        delay: 5 / 60
      })

      tl.call(() => {
        resolve()
      })
    })
  }

  // ============================================================================
  // MAIN LOADING SEQUENCE
  // ============================================================================

  onMount(async () => {
    // Start terminal typer for visual feedback
    if (terminalBoxElement) {
      typer = terminalTyper(terminalBoxElement, generateLoadingOutput())
    }

    // Step 1: Initialize drawbridge FIRST if in DRAWBRIDGE mode
    // This gives us a public client to reuse, avoiding double RPC polling
    const drawbridgePublicClient = await initDrawbridgeIfNeeded()

    // Step 2: Initialize public network and wait for chain sync to complete
    // Pass the drawbridge public client if available (reuses same RPC connection)
    await initPublicNetwork({
      environment,
      url: page.url,
      publicClient: drawbridgePublicClient
    })

    // Step 3: Get player ID from wallet if connected
    // For DRAWBRIDGE: already initialized in step 1
    // For BURNER: initializes burner wallet now using MUD's public network
    const playerId = getPlayerIdFromWallet()

    // Step 4: Initialize entities (chain sync is now complete)
    if (playerId) {
      console.log("[Loading] Initializing entities for player:", playerId)
      initEntities({ activePlayerId: playerId })
    } else {
      console.log("[Loading] No player ID - deferring initEntities to Spawn")
    }

    // Step 5: Stop terminal typer
    if (typer?.stop) {
      typer.stop()
    }

    // Step 6: Animate out and signal completion
    await animateOut()
    loaded()
  })

  onDestroy(() => {
    if (typer?.stop) {
      typer.stop()
    }
  })
</script>

<div class="loading" bind:this={loadingElement}>
  <div class="status-box">
    <div>{UI_STRINGS.blockNumber}: {$blockNumber}</div>
    <div>{UI_STRINGS.loadingMsg}: {$loadingMessage}</div>
    <div>{UI_STRINGS.loadingPercentage}: {$loadingPercentage}</div>
    <div>{UI_STRINGS.readyQuestion} {$ready}</div>
  </div>
  <div class="mc-logo" bind:this={logoElement}>
    <img src="/images/logo.png" alt={UI_STRINGS.authorFullTitle} />
  </div>
  <div class="terminal-box" bind:this={terminalBoxElement}></div>
</div>

<style lang="scss">
  .loading {
    position: fixed;
    top: 0;
    left: 0;
    color: var(--foreground);
    font-size: var(--font-size-normal);
    width: 100dvw;
    height: 100dvh;
    z-index: var(--z-top);
    user-select: none;

    .terminal-box {
      font-size: var(--font-size-normal);
      width: 100%;
      height: 100%;
      max-width: 800px;
      text-align: left;
      padding: 20px;
      overflow-x: hidden;
      overflow-wrap: break-word;

      @media (max-width: 800px) {
        padding: 10px;
        font-size: var(--font-size-small);
        max-width: 100dvw;
      }
    }

    .mc-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      opacity: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .status-box {
      position: fixed;
      top: 0;
      right: 0;
      padding: 10px;
      background: yellow;
      font-size: 10px;
      color: black;
      display: none;
    }
  }
</style>
