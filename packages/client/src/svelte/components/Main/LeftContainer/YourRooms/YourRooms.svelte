<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"
  import CreateRoomButton from "@components/Main/LeftContainer/YourRooms/CreateRoomButton.svelte"
  import RoomsListing from "@components/Main/Shared/RoomsListing/RoomsListing.svelte"
  const { enums } = getUIState()
</script>

<div class="your-rooms">
  <CreateRoomButton />
  <RoomsListing isOwnRoomListing={true} pane={enums.PANE.LEFT} />
</div>

<style lang="scss">
  .your-rooms {
    height: 100%;
    flex-direction: column;
  }
</style>
