<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { onMount, onDestroy } from "svelte"
  import * as transitions from "svelte/transition"
  import { playSound } from "$lib/modules/sound"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  const {
    onComplete,
    result,
    seed1,
    seed2
  }: {
    onComplete: () => void
    result: EnterTripReturnValue | null
    seed1: number
    seed2: number
  } = $props()

  const MINIMUM_DURATION = 8000

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
    backgroundMusic.play({ category: "ratfunMusic", id: "tripProcessing" })

    // Set the trip processing shader with custom uniforms
    shaderManager.setShader("tripProcessing", false, {
      u_seed1: { type: "float", value: seed1 },
      u_seed2: { type: "float", value: seed2 }
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
    backgroundMusic.stop()
  })
</script>

{#if timeElapsed > 10 && timeElapsed < 18}
  <div
    in:transitions.scale|global={{ duration: 500, opacity: 1 }}
    out:transitions.fade={{ duration: 300 }}
    class="popup"
  >
    <div>RAT STILL IN HALLUCINATORY STATE.<br />PLEASE STAND BY...</div>
  </div>
{:else if timeElapsed > 20 && timeElapsed < 28}
  <div
    in:transitions.scale|global={{ duration: 500, opacity: 1 }}
    out:transitions.fade={{ duration: 300 }}
    class="popup"
  >
    <div>
      RAT BEING REVIVED FROM DEEP DRUG INDUCED COMA.<br />EVERYTHING IS NORMAL.<br />PLEASE STAND
      BY...
    </div>
  </div>
{:else if timeElapsed > 30}
  <div
    in:transitions.scale|global={{ duration: 500, opacity: 1 }}
    out:transitions.fade={{ duration: 300 }}
    class="popup"
  >
    <div>
      ALL IS FINE.<br /> JUST ONE MOMENT.<br /> WE VALUE YOUR PATIENCE.
    </div>
  </div>
{/if}

{#if import.meta.env.DEV}
  <div class="splash-screen">
    <div class="timer" class:critical={timerDone}>{timeElapsed.toFixed(1)}s</div>
    <div class="inner"></div>
  </div>
{/if}

<style lang="scss">
  .popup {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 600px;
    height: 300px;
    transform: translate(-50%, -50%);
    color: white;
    border: 3px solid var(--color-grey-mid);
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    text-align: center;
    z-index: var(--z-modal);
    background: black;
    div {
      width: 500px;
      font-family: var(--special-font-stack);
      font-size: var(--font-size-extra-large);
      line-height: 0.9em;
    }
  }

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
      font-size: 10px;
      font-family: monospace;
      background: var(--color-alert);
      color: var(--background);
      padding: 5px 21px;
      border-radius: 8px;
      min-width: 80px;
      text-align: center;

      &.critical {
        background: red;
      }
    }
  }
</style>
