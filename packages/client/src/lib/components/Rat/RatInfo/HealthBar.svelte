<script lang="ts">
  import { HEALTH_SYMBOL } from "$lib/modules/ui/constants"
  import { Tween } from "svelte/motion"
  import { rat } from "$lib/modules/state/stores"
  import { ratState } from "$lib/components/Rat/state.svelte"

  // Define the comparison
  let current = $derived(ratState?.balance?.current ?? 0)
  let target = $derived(Number($rat?.balance ?? 0))

  const tweenedValue = new Tween(current, { duration: 0 })

  // Health 0-25 => 1
  // Health 26-50 => 2
  // Health 51-75 => 3
  // Health 76-> => 4
  let healthLevel = $derived(Math.floor(tweenedValue.current / 25))

  $effect(() => {
    if (target != current) {
      tweenedValue.set(target, { duration: 2000 })
    }
  })
</script>

<div class="health-bar">
  <div class="health-bar-inner">
    <span class="health-bar-inner-value">{HEALTH_SYMBOL} {Math.floor(tweenedValue.current)}</span>
    <div
      class="health-bar-inner-fill"
      style:width={`${Math.floor(tweenedValue.current)}%`}
      class:health-level-1={healthLevel == 0}
      class:health-level-2={healthLevel == 1}
      class:health-level-3={healthLevel == 2}
      class:health-level-4={healthLevel > 2}
    ></div>
  </div>
</div>

<style lang="scss">
  .health-bar {
    width: 100%;
    height: 100%;
    transition: background-color 0.2s ease;

    .health-bar-inner {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .health-bar-inner-value {
      position: absolute;
      top: 50%;
      left: 10px;
      transform: translateY(-50%);
      z-index: 2;
      color: black;
      pointer-events: none;
    }

    .health-bar-inner-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      transition: width 0.2s ease-in-out;
    }

    .health-level-1 {
      background-color: rgb(255, 66, 66);
    }

    .health-level-2 {
      background-color: rgb(255, 126, 21);
    }

    .health-level-3 {
      background-color: rgb(129, 255, 255);
    }

    .health-level-4 {
      background-color: rgb(135, 255, 135);
    }
  }
</style>
