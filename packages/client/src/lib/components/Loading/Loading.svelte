<script lang="ts">
  import { onMount } from "svelte"
  import { ready } from "$lib/modules/network"
  import { initPublicNetwork } from "$lib/initPublicNetwork"
  import { initEntities } from "$lib/modules/systems/initEntities"
  import { terminalTyper } from "$lib/modules/terminal-typer/index"
  import { generateLoadingOutput } from "$lib/components/Loading/loadingOutput"

  import { ENVIRONMENT } from "$lib/mud/enums"
  import { gsap } from "gsap"

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

  // Elements
  let loadingElement: HTMLDivElement
  let terminalBoxElement: HTMLDivElement
  let logoElement: HTMLDivElement

  // Wait for both chain sync and minimum duration to complete
  $effect(() => {
    if ($ready && minimumDurationComplete) {
      // ??? Explain what this does
      initEntities()
      // We are loaded. Animate the component out...
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

    // Create strobe effect: 16 cycles of 1/60s (1 frame each at 60fps)
    for (let i = 0; i < 16; i++) {
      tl.to(loadingElement, {
        background: strobeColors[i % strobeColors.length], // Cycle through strobe colors
        duration: 0,
        delay: 1 / 60 // Half cycle for on
      })
      tl.to(loadingElement, {
        background: "transparent",
        duration: 0,
        delay: 1 / 60 // Half cycle for off
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
    // This sets up the public network and listens to the SyncProgress component
    // When sync is complete, the ready store is set to true
    // We listen to for this in the $effect above
    await initPublicNetwork(environment)

    // Start the minimum duration timer
    setTimeout(() => {
      minimumDurationComplete = true
    }, minimumDuration)

    // Run the terminal typer
    if (terminalBoxElement) {
      terminalTyper(terminalBoxElement, generateLoadingOutput())
    }
  })
</script>

<div class="loading" bind:this={loadingElement}>
  <div class="mc-logo" bind:this={logoElement}>
    <img src="/images/logo.png" alt="Moving Castles GmbH" />
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
    width: 100vw;
    height: 100vh;
    z-index: var(--z-top);

    .terminal-box {
      font-size: var(--font-size-normal);
      width: 100%;
      height: 100%;
      max-width: 800px;
      text-align: left;
      // word-break: break-all;
      padding: 20px;
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
  }
</style>
