<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"

  import YourRat from "@components/Main/LeftContainer/YourRat/YourRat.svelte"
  import YourRooms from "@components/Main/LeftContainer/YourRooms/YourRooms.svelte"
  import CreateRoom from "@components/Main/LeftContainer/CreateRoom/CreateRoom.svelte"

  let { panes, enums } = getUIState()

  export let environment: Environment
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
      class:selected={[
        enums.LEFT_PANE.YOUR_ROOMS,
        enums.LEFT_PANE.CREATE_ROOM,
      ].includes(panes.left)}
      class="pane-switch-item"
    >
      YOUR ROOMS
    </button>
  </div>

  <div
    class:active-tab={panes.left === enums.LEFT_PANE.YOUR_RAT}
    class="tab-content"
  >
    <YourRat />
  </div>
  <div
    class:active-tab={panes.left === enums.LEFT_PANE.YOUR_ROOMS}
    class="tab-content"
  >
    <YourRooms />
  </div>
  {#if panes.left === enums.LEFT_PANE.CREATE_ROOM}
    <div class="tab-content">
      <CreateRoom />
    </div>
  {/if}
</div>

<style lang="scss">
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
    border: none;
    outline: none;
    border-right: 1px solid white;
    background: rgb(126, 126, 126);
    color: white;
    width: 50%;

    &.selected {
      background: white;
      color: black;
    }
  }

  .tab-content {
    height: calc(100% - 60px);
    display: none;
  }

  .active-tab {
    display: block;
  }
</style>
