<script lang="ts">
  import { gameConfig } from "@modules/state/base/stores"
  import { onMount } from "svelte"

  let timeLeft = $state("")
  let interval: number

  function updateCountdown() {
    const now = new Date()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()

    // Calculate minutes until next half hour
    let minutesUntilNext = 30 - (minutes % 30)
    if (minutesUntilNext === 30) minutesUntilNext = 0

    // Calculate total seconds left
    const totalSecondsLeft = minutesUntilNext * 60 - seconds

    // If we're at exactly the half hour, target the next one
    if (totalSecondsLeft === 0) {
      minutesUntilNext = 30
    }

    // Format as MM:SS
    const mins = Math.floor(totalSecondsLeft / 60)
    const secs = totalSecondsLeft % 60
    timeLeft = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  onMount(() => {
    updateCountdown()
    interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  })
</script>

<div class="world-prompt-box">
  <div class="header">
    <div class="countdown">{timeLeft}</div>
  </div>
  <div class="prompt">
    <div class="prompt-text">{$gameConfig?.worldPrompt}</div>
  </div>
</div>

<style lang="scss">
  .world-prompt-box {
    display: flex;
    flex-direction: row;
    border-bottom: var(--default-border-style);
    height: var(--world-prompt-box-height);
    display: flex;
    flex-direction: column;
    text-align: center;
    background-color: var(--color-grey-darker);
    user-select: none;

    .header {
      border-bottom: var(--default-border-style);
      padding-top: 5px;
      padding-bottom: 5px;
      padding-inline: 10px;
      font-size: var(--font-size-small);
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;

      .countdown {
        position: relative;
        top: 1px;
      }
    }

    .prompt {
      padding-inline: 5px;
      padding-top: 5px;
      padding-bottom: 5px;
      height: 100%;
      font-family: var(--special-font-stack);
      font-size: var(--font-size-large);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  }
</style>
