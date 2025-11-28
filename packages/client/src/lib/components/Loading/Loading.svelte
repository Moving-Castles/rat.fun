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
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings"
  import { addressToId } from "$lib/modules/utils"

  import { ENVIRONMENT, WALLET_TYPE } from "$lib/mud/enums"
  import { gsap } from "gsap"

  // Wallet setup imports
  import { setupBurnerWalletNetwork } from "$lib/mud/setupBurnerWalletNetwork"
  import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
  import { initializeDrawbridge, getDrawbridge } from "$lib/modules/drawbridge"

  const {
    environment,
    loaded = () => {},
    minimumDuration = 2000
  }: {
    environment: ENVIRONMENT
    loaded: () => void
    minimumDuration?: number
  } = $props()

  let minimumDurationComplete = $state(false)
  let walletSetupComplete = $state(false)
  let typer = $state<{ stop: () => void }>()

  // Elements
  let loadingElement: HTMLDivElement
  let terminalBoxElement: HTMLDivElement
  let logoElement: HTMLDivElement

  /**
   * Initialize wallet infrastructure and call initEntities if we have a player address.
   * Returns true if initEntities was called (address known), false otherwise.
   */
  async function initWalletAndEntities(): Promise<boolean> {
    const walletType = get(walletTypeStore)
    const network = get(publicNetwork)

    if (walletType === WALLET_TYPE.BURNER) {
      // Burner wallet: always have address from localStorage private key
      const wallet = setupBurnerWalletNetwork(network)
      const address = wallet.walletClient?.account?.address
      if (address) {
        const playerId = addressToId(address)
        console.log("[Loading] Burner wallet - initializing entities for:", playerId)
        initEntities({ activePlayerId: playerId })
        return true
      }
      return false
    }

    if (walletType === WALLET_TYPE.DRAWBRIDGE) {
      // Initialize drawbridge
      const networkConfig = getNetworkConfig(environment, page.url)
      await initializeDrawbridge(networkConfig)

      // Check if user already has a session (wallet connected from localStorage)
      const drawbridge = getDrawbridge()
      const address = drawbridge.getState().userAddress
      if (address) {
        const playerId = addressToId(address)
        console.log("[Loading] Drawbridge session found - initializing entities for:", playerId)
        initEntities({ activePlayerId: playerId })
        return true
      }

      // No existing session - initEntities will be called in Spawn after wallet connection
      console.log("[Loading] No drawbridge session - deferring initEntities to Spawn")
      return false
    }

    return false
  }

  // Wait for chain sync, minimum duration, AND wallet setup to complete
  $effect(() => {
    if ($ready && minimumDurationComplete && walletSetupComplete) {
      // Stop the terminal typer
      if (typer?.stop) {
        typer.stop()
      }

      // Animate out and proceed to spawn
      animateOut()
    }
  })

  const strobeColors = ["#ff0000", "#00ff00", "#0000ff"]

  const animateOut = async () => {
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
      loaded()
    })
  }

  onMount(async () => {
    // Setup public network and sync from indexer
    await initPublicNetwork(environment, page.url)

    // Start the minimum duration timer
    setTimeout(() => {
      minimumDurationComplete = true
    }, minimumDuration)

    // Run the terminal typer
    if (terminalBoxElement) {
      typer = terminalTyper(terminalBoxElement, generateLoadingOutput())
    }

    // Initialize wallet and entities (if address known)
    // Runs in parallel with chain sync for no added latency
    await initWalletAndEntities()
    walletSetupComplete = true
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
