<script lang="ts">
  import { onMount } from "svelte"
  import { gameConfig } from "@modules/state/base/stores"
  import { tippy } from "svelte-tippy"

  let timeLeft = $state("")
  let isFlashing = $state(false)
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

    // If we're at exactly the half hour, start flashing
    if (totalSecondsLeft === 0) {
      isFlashing = true
      timeLeft = "00:00"

      // After one minute, stop flashing and target next half hour
      setTimeout(() => {
        isFlashing = false
        minutesUntilNext = 30
        const newTotalSecondsLeft = minutesUntilNext * 60
        const mins = Math.floor(newTotalSecondsLeft / 60)
        const secs = newTotalSecondsLeft % 60
        timeLeft = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      }, 60000)
      return
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
  <div
    class="header"
    use:tippy={{
      content: "Situation will change when timer reaches 0.",
    }}
  >
    <div class="countdown" class:flashing={isFlashing}>{timeLeft}</div>
  </div>
  <div
    class="prompt"
    use:tippy={{
      content: "Current situation in the facility. Affects all rooms.",
    }}
  >
    <div class="alert">!!!</div>
    <div class="prompt-text">{$gameConfig?.worldPrompt}</div>
    <div class="alert">!!!</div>
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

        &.flashing {
          color: var(--color-death);
          animation: flash 1s infinite;
        }
      }
    }

    .prompt {
      height: 100%;
      font-family: var(--special-font-stack);
      font-size: var(--font-size-large);
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      line-height: 0.8em;

      .alert {
        font-size: var(--font-size-large);
        font-weight: bold;
        background: var(--color-death);
        height: 100%;
        width: 2ch;
        color: var(--background);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  @keyframes flash {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
</style>
