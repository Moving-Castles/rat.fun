<script lang="ts">
  import RoomListing from "@components/Main/Shared/RoomListing/RoomListing.svelte"
</script>

<div class="your-rooms">
  <RoomListing isOwnRoomListing={true} />
</div>

<style lang="scss">
  .your-rooms {
    height: 100%;
    flex-direction: column;
  }
</style>
