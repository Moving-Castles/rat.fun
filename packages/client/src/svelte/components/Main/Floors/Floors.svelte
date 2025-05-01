<script lang="ts">
  import { Spring } from "svelte/motion"
  import { gameConfig, ratLevelIndex } from "@modules/state/base/stores"
  import { tippy } from "svelte-tippy"

  const doorProgress = new Spring(1)

  let elevatorIndex = $state(0)
  let clientHeight = $state(0)

  export const goToLevel = async (num: number) => {
    await doorProgress.set(0)
    elevatorIndex = num
    await new Promise(r => setTimeout(r, 200))
    await doorProgress.set(1)
  }

  $effect(() => {
    goToLevel($ratLevelIndex)
  })
</script>

<!-- <svelte:window
  onkeypress={async e => {
    switch (e.key) {
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
        // tempIndex = Number(e.key)
        if (import.meta.env.DEV) {
          goToLevel(Number(e.key))
        }
        break
      default:
        break
    }
  }}
/> -->

<div class="floor-bar" bind:clientHeight>
  <div class="elevator">
    {#if elevatorIndex >= 0}
      <div
        style:transform="translateY({elevatorIndex * (clientHeight / 6)}px)"
        class="elevator-item"
      >
        <div
          class="your-floor"
          style:background-image="url(/images/rat.png)"
        ></div>
        <div
          style:transform="translateX(-{doorProgress.current * 100}%)"
          class="elevator-door-l"
        ></div>
        <div
          style:transform="translateX({doorProgress.current * 100}%)"
          class="elevator-door-r"
        ></div>
        <span>
          <!-- {elevatorIndex * -1} -->
        </span>
      </div>
    {/if}
  </div>
  {#each $gameConfig?.levelList || [] as _, i (i)}
    {#if i < elevatorIndex}
      <div
        use:tippy={{
          content:
            "Your rat has gone past this floor, lose rat value to access",
        }}
        class="floor-item"
      >
        {i * -1}
      </div>
    {:else if i > elevatorIndex}
      <div
        use:tippy={{
          content: "Not available yet. Gain more rat value for rat to access",
        }}
        class="floor-item"
      >
        {i * -1}
      </div>
    {:else}
      <div
        use:tippy={{ content: "Your rat is on this floor" }}
        class="floor-item"
      >
        {i * -1}
      </div>
    {/if}
  {/each}
</div>

<style lang="scss">
  .floor-bar {
    width: 160px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-right: var(--dashed-border-style);
    border-left: var(--dashed-border-style);
    position: relative;
  }

  .floor-item {
    width: 100%;
    height: calc(100% / 3);
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: var(--dashed-border-style);
    position: relative;

    &:last-child {
      border-bottom: none;
    }
  }

  .your-floor {
    position: absolute;
    inset: 0;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-color: black;
  }

  .elevator {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }

  .elevator-item {
    height: calc((100% / 3) - 2px);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.2s ease;
    overflow: hidden;
    background-size: cover;
    background-blend-mode: multiply;
  }

  .elevator-door-l {
    left: 0;
    border-right: var(--default-border-style);
  }

  .elevator-door-r {
    right: 0;
    border-left: var(--default-border-style);
  }

  .elevator-door-l,
  .elevator-door-r {
    width: 50%;
    position: absolute;
    height: 100%;
    background: black;
  }
</style>
