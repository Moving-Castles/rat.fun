<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { onMount, onDestroy } from "svelte"
  import { playSound } from "$lib/modules/sound"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { singleFrameRender } from "$lib/modules/ui/state.svelte"
  import TripProcessingPopUp from "./TripProcessingPopUp.svelte"

  const {
    onComplete,
    isChallengeTrip = false,
    result,
    seed1,
    seed2
  }: {
    onComplete: () => void
    isChallengeTrip: boolean
    result: EnterTripReturnValue | null
    seed1: number
    seed2: number
  } = $props()

  const MINIMUM_DURATION = 8000

  $inspect("isChallengeTrip", isChallengeTrip)
  // svelte-ignore state_referenced_locally
  const musicId = isChallengeTrip ? "triportrapProcessing" : "tripProcessing"

  // Timer state
  let timeElapsed = $state(0)
  let timerInterval: ReturnType<typeof setInterval> | undefined
  let timerDone = $state(false)

  // Wait until timer is done AND result is available
  // We do this so that the visualized will last at least MINIMUM_DURATION
  $effect(() => {
    if (timerDone && result) onComplete()
  })

  onMount(() => {
    playSound({ category: "ratfunTransitions", id: "tripProcessingEnter" })
    backgroundMusic.play({ category: "ratfunMusic", id: musicId })

    // Enable continuous rendering for trip processing animation
    shaderManager.enableContinuousRendering()

    // Set the trip processing shader with custom uniforms
    // u_quality: 0.0 on mobile (skip madness layer), 1.0 on desktop (full quality)
    shaderManager.setShader("tripProcessing", false, {
      u_seed1: { type: "float", value: seed1 },
      u_seed2: { type: "float", value: seed2 },
      u_quality: { type: "float", value: $singleFrameRender ? 0.0 : 1.0 }
    })

    // Start timer
    timerInterval = setInterval(() => {
      timeElapsed += 0.1
    }, 100)

    setTimeout(() => {
      timerDone = true
    }, MINIMUM_DURATION)
  })

  onDestroy(async () => {
    if (timerInterval) clearInterval(timerInterval)
    backgroundMusic.stop()
    // Disable continuous rendering when trip processing ends
    shaderManager.disableContinuousRendering()
  })
</script>

{#if timeElapsed > 10 && timeElapsed < 18}
  <TripProcessingPopUp type="first" />
{:else if timeElapsed > 20 && timeElapsed < 28}
  <TripProcessingPopUp type="second" />
{:else if timeElapsed > 30}
  <TripProcessingPopUp type="third" />
{/if}

{#if import.meta.env.DEV}
  <div class="splash-screen">
    <div class="timer" class:critical={timerDone}>{timeElapsed.toFixed(1)}s</div>
    <div class="inner"></div>
  </div>
{/if}

<style lang="scss">
  .splash-screen {
    padding: 0;
    position: absolute;
    inset: 0;
    text-align: center;
    display: flex;
    height: var(--game-window-height);
    justify-content: center;
    align-items: center;
    color: var(--foreground);
    font-size: var(--font-size-normal);

    .inner {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      width: 500px;
      max-width: calc(var(--game-window-width) * 0.9);
    }

    .timer {
      position: fixed;
      top: 10px;
      right: 10px;
      font-size: var(--font-size-very-small);
      font-family: monospace;
      background: var(--color-grey-mid);
      color: var(--background);
      padding: 5px 21px;
      border-radius: 8px;
      min-width: 80px;
      text-align: center;

      &.critical {
        background: var(--color-bad);
      }
    }
  }
</style>
