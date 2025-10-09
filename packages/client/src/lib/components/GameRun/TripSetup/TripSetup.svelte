<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"
  import { Howl } from "howler"
  import type { Trip as SanityTrip } from "@sanity-types"
  import { terminalTyper } from "$lib/modules/terminal-typer/index"
  import { generateTripSetupOutput } from "./tripSetupOutput"
  import { playSound } from "$lib/modules/sound"

  gsap.registerPlugin(TextPlugin)

  let terminalBoxElement = $state<HTMLDivElement>()
  let backgroundMusic: Howl | undefined = $state()

  const {
    onComplete,
    staticTripContent
  }: {
    onComplete: () => void
    staticTripContent: SanityTrip | undefined
  } = $props()

  const SETUP_DURATION = 5000

  onMount(async () => {
    backgroundMusic = playSound("ratfunMusic", "tripSetup", true)

    setTimeout(() => {
      onComplete()
    }, SETUP_DURATION)

    if (terminalBoxElement) {
      await terminalTyper(terminalBoxElement, generateTripSetupOutput())
    }
  })

  onDestroy(() => {
    // Stop background music
    if (backgroundMusic) {
      backgroundMusic.stop()
      backgroundMusic = undefined
    }
  })
</script>

<div class="splash-screen">
  <div class="terminal-box" bind:this={terminalBoxElement}></div>
</div>

<style lang="scss">
  .splash-screen {
    padding: 0;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    color: var(--foreground);
    font-size: var(--font-size-normal);
    background: rgba(0, 0, 0, 0.1);

    .terminal-box {
      font-size: var(--font-size-normal);
      width: calc(100% - 30px);
      height: calc(100% - 40px);
    }
  }
</style>
