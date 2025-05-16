<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { SvelteURL } from "svelte/reactivity"

  import RoomListing from "@svelte/components/Main/Shared/RoomListing/RoomListing.svelte"
  import YourRooms from "@components/Main/RoomContainer/YourRooms/YourRooms.svelte"
  import CreateRoom from "@components/Main/RoomContainer/CreateRoom/CreateRoom.svelte"
  import FloorHeader from "@components/Main/Shared/RoomListing/FloorHeader.svelte"

  let { environment }: { environment: ENVIRONMENT } = $props()

  const url = new SvelteURL(window.location.href)
  let hash = $derived(url.hash.replace("#", ""))

  const { enums, panes, rooms } = getUIState()

  $effect(() => {
    if (hash !== "") {
      rooms.preview(hash)
    }
  })
</script>

<svelte:window
  onhashchange={e => {
    url.href = e.newURL
  }}
/>

<div class="room-container">
  <div class="pane-switch">
    <button
      onclick={() => {
        panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.ALL_ROOMS)
        rooms.back()
      }}
      class:selected={panes.roomContainer === enums.ROOM_CONTAINER.ALL_ROOMS}
      class="pane-switch-item"
    >
      ALL ROOMS
    </button>
    <button
      onclick={() => {
        panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.YOUR_ROOMS)
        rooms.back(true)
      }}
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
    color: var(--background);
    width: 50%;

    &:hover {
      background: var(--color-grey-light);
    }

    &.selected {
      background: var(--color-alert);
      color: var(--foreground);
    }
  }

  .tab-content {
    height: calc(100% - 60px);
    overflow-y: scroll;
  }
</style>
