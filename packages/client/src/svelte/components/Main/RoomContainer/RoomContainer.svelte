<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"

  import RoomsListing from "@components/Main/Shared/RoomsListing/RoomsListing.svelte"
  import YourRooms from "@components/Main/RoomContainer/YourRooms/YourRooms.svelte"
  import CreateRoom from "@components/Main/RoomContainer/CreateRoom/CreateRoom.svelte"

  import { ENVIRONMENT } from "@mud/enums"

  const { enums, panes } = getUIState()

  export let environment: ENVIRONMENT
</script>

<div class="room-container">
  <div class="pane-switch">
    <button
      onclick={() =>
        panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.ALL_ROOMS)}
      class:selected={panes.roomContainer === enums.ROOM_CONTAINER.ALL_ROOMS}
      class="pane-switch-item"
    >
      ALL ROOMS
    </button>
    <button
      onclick={() =>
        panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.YOUR_ROOMS)}
      class:selected={[
        enums.ROOM_CONTAINER.YOUR_ROOMS,
        enums.ROOM_CONTAINER.CREATE_ROOM,
      ].includes(panes.roomContainer)}
      class="pane-switch-item"
    >
      YOUR ROOMS
    </button>
  </div>

  {#if panes.roomContainer === enums.ROOM_CONTAINER.ALL_ROOMS}
    <RoomsListing isOwnRoomListing={false} />
  {/if}

  {#if panes.roomContainer === enums.ROOM_CONTAINER.YOUR_ROOMS}
    <div class="tab-content your-rooms-tab">
      <YourRooms />
    </div>
  {/if}

  {#if panes.roomContainer === enums.ROOM_CONTAINER.CREATE_ROOM}
    <div class="tab-content">
      <CreateRoom {environment} />
    </div>
  {/if}
</div>

<style lang="scss">
  .room-container {
    width: 100%;
    border-bottom: var(--default-border-style);
    height: 100%;
  }

  .pane-switch {
    display: flex;
    flex-direction: row;
    border-bottom: var(--default-border-style);
    height: 60px;
    line-height: 60px;
  }

  .pane-switch-item {
    text-align: center;
    padding-inline: 20px;
    border: none;
    outline: none;
    background: var(--color-grey-mid);
    color: white;
    width: 50%;

    &.selected {
      background: var(--color-alert);
      color: black;
    }
  }

  .tab-content {
    height: calc(100% - 60px);
    overflow-y: scroll;
  }
</style>
