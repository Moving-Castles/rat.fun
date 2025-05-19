<script lang="ts">
  import { Spring } from "svelte/motion"
  import {
    gameConfig,
    ratLevelIndex,
    ratLevel,
    ratTotalValue,
  } from "@modules/state/base/stores"

  import FloorItem from "./FloorItem.svelte"

  const doorProgress = new Spring(1)

  let elevatorIndex = $state(0)
  let clientHeight = $state(0)

  export const goToLevel = async (num: number) => {
    await doorProgress.set(0)
    elevatorIndex = num
    await new Promise(r => setTimeout(r, 200))
    await doorProgress.set(1)
  }

  let floorProgress = $derived.by(() => {
    const range =
      Number($ratLevel?.levelMaxBalance ?? 0) -
      Number($ratLevel?.levelMinBalance ?? 0)
    const value =
      Number($ratTotalValue) - Number($ratLevel?.levelMinBalance ?? 0)

    return value / range
  })

  $effect(() => {
    goToLevel($ratLevelIndex)
  })
</script>

<div class="floor-bar" bind:clientHeight>
  <div class="elevator">
    {#if elevatorIndex >= 0}
      <div
        style:transform="translateY({elevatorIndex * (clientHeight / 5)}px)"
        class="elevator-item"
      >
        <div class="your-floor" style:background-image="url(/images/rat.png)">
          <div class="progress warning-mute">
            <div class="label-min">
              ${$ratLevel?.levelMinBalance ?? 0}
            </div>
            <div class="label-max">
              ${$ratLevel?.levelMaxBalance ?? 0}
            </div>
            <div class="bar-current" style:width="{floorProgress * 100}%"></div>
          </div>
        </div>
        <!-- Elevator door: left -->
        <div
          style:transform="translateX(-{doorProgress.current * 100}%)"
          class="elevator-door-l"
        ></div>
        <!-- Elevator door: right -->
        <div
          style:transform="translateX({doorProgress.current * 100}%)"
          class="elevator-door-r"
        ></div>
        <!-- Elevator floor number -->
        <div class="elevator-floor-number">
          {elevatorIndex * -1}
        </div>
        <!-- Elevator floor name -->
        <div class="elevator-floor-name">
          {$ratLevel?.name ?? ""}
        </div>
      </div>
    {/if}
  </div>
  {#each $gameConfig?.levelList || [] as levelId, i (i)}
    <FloorItem {levelId} {i} />
  {/each}
</div>

<style lang="scss">
  .floor-bar {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    border-right: var(--dashed-border-style);
    border-left: var(--dashed-border-style);
    position: relative;
    background: repeating-linear-gradient(
      45deg,
      #000000,
      #000000 20px,
      var(--color-grey-dark) 20px,
      var(--color-grey-dark) 40px
    );
  }

  .your-floor {
    position: absolute;
    inset: 0;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-color: var(--background);

    .progress {
      width: 100%;
      position: absolute;
      bottom: 0;
      display: flex;
      justify-content: space-between;
      background-color: var(--background);

      .bar-current {
        height: 100%;
        position: absolute;
        left: 0;
        background-color: var(--color-value);
        z-index: 0;
      }

      .label-min,
      .label-max {
        z-index: 1;
        padding-top: 4px;
        padding-bottom: 2px;
        padding-left: 4px;
        padding-right: 4px;
        font-size: var(--font-size-small);
      }
    }
  }

  .elevator {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }

  .elevator-item {
    height: calc((100% / 5) - 2px);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.2s ease;
    overflow: hidden;
    background-size: cover;
    background-blend-mode: lighten;
  }

  .elevator-door-l,
  .elevator-door-r {
    width: 50%;
    position: absolute;
    height: 100%;
    background: var(--background);
  }

  .elevator-door-l {
    left: 0;
    border-right: var(--default-border-style);
  }

  .elevator-door-r {
    right: 0;
    border-left: var(--default-border-style);
  }

  .elevator-floor-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: var(--font-size-normal);
    background: var(--color-alert-priority);
    color: var(--background);
    padding: 5px;
  }

  .elevator-floor-name {
    position: absolute;
    top: 5px;
    left: 50%;
    transform: translate(-50%, 0%);
    font-size: var(--font-size-small);
    white-space: nowrap;
  }
</style>
