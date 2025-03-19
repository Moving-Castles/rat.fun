<script lang="ts">
  import { onMount } from "svelte"
  import { gameConfig, ratLevelIndex } from "@modules/state/base/stores"

  onMount(() => {
    console.log("FloorBar component mounted")
  })
</script>

<div class="floor-bar">
  {#each $gameConfig.levelList as _, i}
    <div class="floor-item">
      {i * -1}
      {#if $ratLevelIndex === i}
        <div class="floor-indicator" />
      {/if}
    </div>
  {/each}
</div>

<style>
  .floor-bar {
    width: 160px;
    height: calc(100vh - 81px);
    display: flex;
    flex-direction: column;
    border-right: 1px dashed white;
    border-left: 1px dashed white;
    position: relative;
  }

  .floor-item {
    width: 100%;
    height: 20%;
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 1px dashed white;
    position: relative;

    &:last-child {
      border-bottom: none;
    }
  }

  .floor-indicator {
    position: absolute;
    inset: 0;
    background: red;
    mix-blend-mode: screen;
    z-index: 1;
  }
</style>
