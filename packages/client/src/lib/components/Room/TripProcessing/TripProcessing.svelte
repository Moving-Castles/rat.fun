<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { playUISound } from "$lib/modules/sound/state.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  const { onComplete, result }: { onComplete: () => void; result: null | any } = $props()

  let sound = $state()
  // Timer state
  let timeElapsed = $state(0)
  let timerInterval: ReturnType<typeof setInterval> | undefined
  let timerDone = $state(false)

  $effect(() => {
    if (timerDone && result) onComplete()
  })

  onMount(() => {
    shaderManager.setShader("vortex")
    playUISound("ratfun", "tripProcessing")
    // Start timer
    timerInterval = setInterval(() => {
      timeElapsed += 0.1
    }, 100)

    setTimeout(() => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
      timerDone = true
      // TODO: we are now returning after a fixed amount of time
      // We should check that the result is ready
    }, 8000)
  })

  onDestroy(async () => {
    const result = await sound
    if (result) {
      result.stop()
    }
  })
</script>

<div class="splash-screen">
  <div class="timer">{timeElapsed.toFixed(1)}s</div>
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
    }
  }
</style>
