<script lang="ts">
  import {
    energyAllocation,
    remainingEnergy,
    TRAIT_LABELS,
    TRAIT_MAX,
  } from "./stores"
  import { playSound } from "@svelte/modules/sound"

  export let index: number

  const label = TRAIT_LABELS[index]

  let holdTimeout: NodeJS.Timeout | null = null
  let repeatInterval: NodeJS.Timeout | null = null

  // MAX FUNCTION
  function max() {
    playSound("tcm", "TRX_wait_a")
    energyAllocation.update(arr => {
      const value = arr[index] + $remainingEnergy
      arr[index] = value > TRAIT_MAX ? TRAIT_MAX : value
      return arr
    })
  }

  // MIN FUNCTION
  function min() {
    playSound("tcm", "TRX_wait_a")
    energyAllocation.update(arr => {
      arr[index] = 0
      return arr
    })
  }

  // INCREMENT FUNCTION
  function increment() {
    playSound("tcm", "TRX_wait_a")
    energyAllocation.update(arr => {
      const value = arr[index] + 1
      arr[index] = value > TRAIT_MAX ? TRAIT_MAX : value
      return arr
    })
  }

  // DECREMENT FUNCTION
  function decrement() {
    playSound("tcm", "TRX_wait_a")
    energyAllocation.update(arr => {
      const value = arr[index] - 1
      arr[index] = value < 0 ? 0 : value
      return arr
    })
  }

  // HANDLER FOR STARTING A REPEATING ACTION AFTER A DELAY
  function startHold(action: () => void) {
    let triggered = false // Flag to prevent multiple initial triggers

    // Trigger the action immediately if it's the first interaction
    if (!triggered) {
      action()
      triggered = true
    }

    // Start hold timer for delayed repeat
    holdTimeout = setTimeout(() => {
      repeatInterval = setInterval(action, 100) // Repeat every 100ms
    }, 500) // Delay before repeating starts
  }

  // STOP THE REPEATING ACTION
  function stopHold() {
    if (holdTimeout) {
      clearTimeout(holdTimeout)
      holdTimeout = null
    }
    if (repeatInterval) {
      clearInterval(repeatInterval)
      repeatInterval = null
    }
  }
</script>

<div class="slider-wrapper">
  <label for={label}>{label}</label>
  <div class="value">{$energyAllocation[index]}</div>
  <div class="buttons">
    <!-- MIN BUTTON -->
    <button class:disabled={$energyAllocation[index] == 0} on:click={min}>
      MIN
    </button>

    <!-- DECREMENT BUTTON -->
    <button
      class:disabled={$energyAllocation[index] == 0}
      on:mousedown={() => startHold(decrement)}
      on:mouseup={stopHold}
      on:mouseleave={stopHold}
      on:touchstart={() => startHold(decrement)}
      on:touchend={stopHold}
    >
      -
    </button>

    <!-- INCREMENT BUTTON -->
    <button
      class:disabled={$remainingEnergy === 0 ||
        $energyAllocation[index] >= TRAIT_MAX}
      on:mousedown={() => startHold(increment)}
      on:mouseup={stopHold}
      on:mouseleave={stopHold}
      on:touchstart={() => startHold(increment)}
      on:touchend={stopHold}
    >
      +
    </button>

    <!-- MAX BUTTON -->
    <button
      class:disabled={$remainingEnergy === 0 ||
        $energyAllocation[index] >= TRAIT_MAX}
      on:click={max}
    >
      MAX
    </button>
  </div>
</div>

<style lang="scss">
  .slider-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    margin-bottom: 20px;
    justify-content: space-between;

    label {
      width: 200px;
      font-weight: bold;
    }

    .value {
      text-align: center;
      background: black;
      margin-right: 20px;
      font-size: 32px;
      width: 200px;
    }
  }

  button {
    font-size: 32px;
    min-width: 40px;
    height: 40px;
    user-select: none;

    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  }
</style>
