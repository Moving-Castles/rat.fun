<script lang="ts">
  import { Spring } from "svelte/motion"
  import { gameConfig, ratLevelIndex, levels } from "@modules/state/base/stores"
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

<div class="floor-bar" bind:clientHeight>
  <div class="elevator">
    {#if elevatorIndex >= 0}
      <div
        style:transform="translateY({elevatorIndex * (clientHeight / 5)}px)"
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
  {#each $gameConfig?.levelList || [] as levelId, i (i)}
    {#if i < elevatorIndex}
      <div
        use:tippy={{
          content: `Name: ${$levels[levelId].name} / Prompt: ${$levels[levelId].prompt} / Min: ${$levels[levelId].levelMinBalance} / Max: ${$levels[levelId].levelMaxBalance}`,
        }}
        class="floor-item"
      >
        {i * -1}
      </div>
    {:else if i > elevatorIndex}
      <div
        use:tippy={{
          content: `Name: ${$levels[levelId].name} / Prompt: ${$levels[levelId].prompt} / Min: ${$levels[levelId].levelMinBalance} / Max: ${$levels[levelId].levelMaxBalance}`,
        }}
        class="floor-item"
      >
        {i * -1}
      </div>
    {:else}
      <div
        use:tippy={{
          content: `Your rat is on this floor. Name: ${$levels[levelId].name} / Prompt: ${$levels[levelId].prompt} / Min: ${$levels[levelId].levelMinBalance} / Max: ${$levels[levelId].levelMaxBalance}`,
        }}
        class="floor-item"
      >
        {i * -1}
      </div>
    {/if}
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

  .floor-item {
    width: 100%;
    height: calc(100% / 5);
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: var(--dashed-border-style);
    position: relative;
    font-size: 18px;

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
    background-color: var(--background);
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
    background: var(--background);
  }
</style>
