<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"
  import RoomsListing from "@svelte/components/Main/Shared/RoomsListing/RoomsListing.svelte"
  import RoomResult from "@components/Main/RightContainer/RoomResult/RoomResult.svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { CurrentRoomId } from "@modules/ui/stores"

  export let environment: ENVIRONMENT

  const { enums, panes } = getUIState()
</script>

<div class="right-container">
  {#if panes.right === enums.RIGHT_PANE.ROOMS}
    <RoomsListing yours={false} pane={enums.PANE.RIGHT} />
  {/if}

  {#if panes.right === enums.RIGHT_PANE.ROOM_RESULT}
    <RoomResult roomId={$CurrentRoomId} {environment} />
  {/if}
</div>

<style lang="scss">
  .right-container {
    width: calc(50% - 80px);
    border-bottom: 1px solid white;
    height: 100%;
  }
</style>
