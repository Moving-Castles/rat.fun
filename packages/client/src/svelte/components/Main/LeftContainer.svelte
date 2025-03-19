<script lang="ts">
  import { onMount } from "svelte"
  import RatEditor from "./RatEditor.svelte"
  import RatCam from "./RatCam.svelte"
  import { getUIState } from "@modules/ui/state.svelte"

  let { panes, enums } = getUIState()

  onMount(() => {
    console.log("LeftContainer component mounted")
  })
</script>

<div class="left-container">
  <div class="pane-switch">
    <button
      onclick={() => panes.set(enums.PANE.LEFT, enums.LEFT_PANE.YOUR_RAT)}
      class:selected={panes.left === enums.LEFT_PANE.YOUR_RAT}
      class="pane-switch-item"
    >
      YOUR RAT
    </button>
    <button
      onclick={() => panes.set(enums.PANE.LEFT, enums.LEFT_PANE.YOUR_ROOMS)}
      class:selected={panes.left === enums.LEFT_PANE.YOUR_ROOMS}
      class="pane-switch-item"
    >
      YOUR ROOMS
    </button>
  </div>

  {#if panes.left === enums.LEFT_PANE.YOUR_RAT}
    <div class="tab-rats">
      <RatEditor />
      <RatCam />
      <div class="liquidate">LIQUIDATE RAT</div>
    </div>
  {/if}
  {#if panes.left === enums.LEFT_PANE.YOUR_ROOMS}
    <div class="create-room">Create room</div>
    <div class="tab-rooms">Rooms</div>
  {/if}
</div>

<style>
  .left-container {
    width: calc(50% - 80px);
    border-bottom: 1px solid white;
  }

  .pane-switch {
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid white;
    height: 60px;
    line-height: 60px;
  }

  .pane-switch-item {
    text-align: center;
    padding-inline: 20px;
    border-right: 1px solid white;

    &.selected {
      background: rgb(126, 126, 126);
      color: white;
    }
  }

  .liquidate {
    padding-inline: 20px;
    height: 100%;
    line-height: 60px;
  }
</style>
