<script lang="ts">
  import { onMount } from "svelte"

  const { onComplete }: { onComplete: () => void } = $props()

  // Timer state
  let timeElapsed = $state(0)
  let timerInterval: ReturnType<typeof setInterval> | undefined

  onMount(() => {
    // Start timer
    timerInterval = setInterval(() => {
      timeElapsed += 0.1
    }, 100)

    setTimeout(() => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
      onComplete()
      // TODO: we are now returning after a fixed amount of time
      // We should check that the result is ready
    }, 7000)
  })
</script>

<div class="splash-screen">
  <div class="inner">
    <div class="processing-title">VISUALIZER</div>
    <div class="timer">{timeElapsed.toFixed(1)}s</div>
  </div>
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
    font-size: 64px;

    .inner {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      width: 500px;
      max-width: calc(var(--game-window-width) * 0.9);
      .processing-title {
        font-size: 64px;
        font-weight: bold;
      }

      .timer {
        font-size: 32px;
        font-family: monospace;
        background: var(--color-alert);
        color: var(--background);
        padding: 10px 20px;
        border-radius: 8px;
        min-width: 120px;
        text-align: center;
      }
    }
  }
</style>
