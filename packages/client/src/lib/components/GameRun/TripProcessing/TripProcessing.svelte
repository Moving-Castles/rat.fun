<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { playSound } from "$lib/modules/sound-classic"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let backgroundMusic: Howl | undefined = $state()

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
    shaderManager.setShader("vortex")
    backgroundMusic = playSound("ratfun", "tripProcessingv2", true)

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
    if (backgroundMusic) {
      backgroundMusic.stop()
      backgroundMusic = undefined
    }
  })
</script>

<div class="splash-screen">
  <div class="timer" class:critical={timerDone}>{timeElapsed.toFixed(1)}s</div>
  <div class="inner"></div>
</div>

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
      top: 20px;
      right: 20px;
      font-size: var(--font-size-normal);
      font-family: monospace;
      background: var(--color-alert);
      color: var(--background);
      padding: 10px 20px;
      border-radius: 8px;
      min-width: 120px;
      text-align: center;

      &.critical {
        background: red;
      }
    }
  }
</style>
