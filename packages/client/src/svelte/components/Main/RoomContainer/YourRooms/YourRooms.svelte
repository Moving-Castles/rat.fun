<script lang="ts">
  import CreateRoomButton from "@components/Main/RoomContainer/YourRooms/CreateRoomButton.svelte"
  import RoomsListing from "@components/Main/Shared/RoomsListing/RoomsListing.svelte"
</script>

<div class="your-rooms">
  <CreateRoomButton />
  <RoomsListing isOwnRoomListing={true} />
</div>

<style lang="scss">
  .your-rooms {
    height: 100%;
    flex-direction: column;
  }
</style>
