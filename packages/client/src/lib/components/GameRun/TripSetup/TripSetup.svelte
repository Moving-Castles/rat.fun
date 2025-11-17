<script lang="ts">
  import type { Trip as SanityTrip } from "@sanity-types"
  import { onMount, onDestroy } from "svelte"
  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"
  import { terminalTyper } from "$lib/modules/terminal-typer/index"
  import { generateTripSetupOutput } from "./tripSetupOutput"
  import { playSound } from "$lib/modules/sound"
  import { backgroundMusic } from "$lib/modules/sound/stores"

  gsap.registerPlugin(TextPlugin)

  let terminalBoxElement = $state<HTMLDivElement>()
  let typer = $state<{ stop: () => void }>()

  const {
    onComplete,
    staticTripContent
  }: {
    onComplete: () => void
    staticTripContent: SanityTrip | undefined
  } = $props()

  const SETUP_DURATION = 6000

  onMount(async () => {
    $backgroundMusic = playSound("ratfunMusic", "tripSetup", true)

    setTimeout(() => {
      // Stop the terminal typer
      if (typer?.stop) {
        typer.stop()
      }
      onComplete()
    }, SETUP_DURATION)

    if (terminalBoxElement) {
      typer = await terminalTyper(terminalBoxElement, generateTripSetupOutput())
    }
  })

  onDestroy(() => {
    // Stop the terminal typer
    if (typer?.stop) {
      typer.stop()
    }

    // Stop background music
    if ($backgroundMusic) {
      $backgroundMusic.stop()
      $backgroundMusic = undefined
    }
  })
</script>

<div class="splash-screen">
  <div class="terminal-box" bind:this={terminalBoxElement}></div>
</div>

<style lang="scss">
  .splash-screen {
    padding: 10px;
    position: fixed;
    top: 0;
    left: 0;
    height: 100dvh;
    width: 100dvw;
    color: var(--foreground);
    font-size: var(--font-size-normal);
    background: rgba(0, 0, 0, 0.1);
    user-select: none;

    .terminal-box {
      font-size: var(--font-size-normal);
      width: calc(100% - 30px);
      max-width: 800px;
      height: calc(100% - 40px);
    }
  }
</style>
