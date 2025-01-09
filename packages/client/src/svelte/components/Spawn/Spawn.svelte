<script lang="ts">
  import { createBrain } from "@svelte/modules/action"
  import { waitForCompletion } from "@svelte/modules/action/actionSequencer/utils"
  import { playSound } from "@svelte/modules/sound"
  import { energyAllocation, remainingEnergy } from "./stores"
  import { player } from "@svelte/modules/state/base/stores"
  import { createEventDispatcher, onMount } from "svelte"
  import { ENTITY_TYPE } from "contracts/enums"
  import Slider from "./Slider.svelte"
  import Spinner from "../Spinner/Spinner.svelte"

  const dispatch = createEventDispatcher()

  const done = () => dispatch("done")

  $: console.log("$player", $player)

  let busy = false

  async function sendCreateBrain() {
    playSound("tcm", "blink")
    busy = true
    const action = createBrain(
      $energyAllocation[0],
      $energyAllocation[1],
      $energyAllocation[2],
      $energyAllocation[3]
    )
    try {
      await waitForCompletion(action)
      done()
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }

  onMount(() => {
    if ($player?.entityType === ENTITY_TYPE.PLAYER) {
      done()
    }
  })
</script>

<div class="main">
  <div class="energy-budget" class:available={$remainingEnergy > 0}>
    FREE ENERGY: {$remainingEnergy}
  </div>
  <div class="slider-container">
    <Slider index={0} />
    <Slider index={1} />
    <Slider index={2} />
    <Slider index={3} />
  </div>
  <div>
    <button disabled={busy} on:click={sendCreateBrain}>CREATE BRAIN</button>
  </div>
  {#if busy}
    <Spinner />
  {/if}
</div>

<style lang="scss">
  .main {
    text-align: center;
    padding: 10px;
    background: rgb(88, 88, 88);
    color: white;
    width: 100%;
  }

  .energy-budget {
    font-size: 48px;
    margin-bottom: 20px;
    background: red;

    &.available {
      background: green;
    }
  }

  button {
    padding: 20px;
    margin-top: 20px;
    font-size: 24px;
    width: 100%;
    cursor: pointer;

    &:hover {
      background: green;
    }
  }
</style>
