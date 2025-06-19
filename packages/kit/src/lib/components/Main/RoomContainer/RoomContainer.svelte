<script lang="ts">
  import { getUIState } from "$lib/modules/ui/state.svelte"
  import { ENVIRONMENT } from "$lib/mud/enums"

  import WorldPromptBox from "$lib/components/Main/RoomContainer/WorldPromptBox.svelte"
  import PaneSwitch from "$lib/components/Main/RoomContainer/PaneSwitch.svelte"
  import RoomListing from "$lib/components/Main/Shared/RoomListing/RoomListing.svelte"
  import YourRooms from "$lib/components/Main/RoomContainer/YourRooms/YourRooms.svelte"
  import CreateRoom from "$lib/components/Main/RoomContainer/CreateRoom/CreateRoom.svelte"

  let { environment }: { environment: ENVIRONMENT } = $props()

  const { enums, panes } = getUIState()
</script>

<div class="room-container">
  <WorldPromptBox />
  <PaneSwitch />

  {#if panes.roomContainer === enums.ROOM_CONTAINER.ALL_ROOMS}
    <RoomListing isOwnRoomListing={false} />
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
    background: black;

    .tab-content {
      height: calc(100% - 60px);
      overflow-y: scroll;
    }
  }
</style>
