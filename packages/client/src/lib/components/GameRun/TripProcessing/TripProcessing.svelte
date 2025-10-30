<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import * as transitions from "svelte/transition"
  import { playSound } from "$lib/modules/sound"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  const { onComplete, result }: { onComplete: () => void; result: null | any } = $props()

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
    playSound("ratfunTransitions", "tripProcessingEnter")
    shaderManager.setShader("vortex")

    $backgroundMusic = playSound("ratfunMusic", "tripProcessing")

    // Start timer
    timerInterval = setInterval(() => {
      timeElapsed += 0.1
    }, 100)

    setTimeout(() => {
      timerDone = true
    }, MINIMUM_DURATION)
  })

  onDestroy(async () => {
    // Stop background music
    if ($backgroundMusic) {
      $backgroundMusic.stop()
      $backgroundMusic = undefined
    }
  })
</script>

{#if timeElapsed > 10 && timeElapsed < 18}
  <div
    in:transitions.scale|global={{ duration: 3000, opacity: 1 }}
    out:transitions.fade={{ duration: 1500 }}
    class="popup"
  >
    <div class="mask">
      <span> RAT STILL IN HALLUCINATORY STATE.<br />PLEASE STAND BY... </span>
    </div>
  </div>
{:else if timeElapsed > 20 && timeElapsed < 28}
  <div
    in:transitions.scale|global={{ duration: 3000, opacity: 1 }}
    out:transitions.fade={{ duration: 1500 }}
    class="popup"
  >
    <div class="mask">
      <span>
        RAT BEING REVIVED FROM DEEP DRUG INDUCED COMA.<br />EVERYTHING IS NORMAL.<br />PLEASE STAND
        BY...
      </span>
    </div>
  </div>
{:else if timeElapsed > 30}
  <div
    in:transitions.scale|global={{ duration: 3000, opacity: 1 }}
    out:transitions.fade={{ duration: 1500 }}
    class="popup"
  >
    <div class="mask">
      <span> ALL IS FINE.<br /> JUST ONE MOMENT.<br /> WE VALUE YOUR PATIENCE. </span>
    </div>
  </div>
{/if}

<div class="splash-screen">
  <!-- {#if $environment !== ENVIRONMENT.BASE} -->
  <div class="timer" class:critical={timerDone}>{timeElapsed.toFixed(1)}s</div>
  <!-- {/if} -->
  <div class="inner"></div>
</div>

<style lang="scss">
  .popup {
    position: fixed;
    top: 50vh;
    left: 50vw;
    width: 600px;
    height: 600px;
    transform: translate(-50%, -50%);
    color: white;

    .mask {
      z-index: 99;
      background: black;
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      text-align: center;
      width: 600px;
      height: 600px;
      mask-image: radial-gradient(circle at center, black 40%, transparent 70%);
      -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 70%);
      animation: slowly-grow 20s linear forwards;

      span {
        display: block;
        width: 300px;
        font-family: var(--special-font-stack);
        font-size: var(--font-size-large);
      }
    }
  }

  @keyframes slowly-grow {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.6);
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
