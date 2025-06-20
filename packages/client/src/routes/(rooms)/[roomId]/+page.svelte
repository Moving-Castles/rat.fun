<script lang="ts">
  import { fly } from "svelte/transition"
  import { rooms } from "$lib/modules/state/base/stores"
  import { page } from "$app/state"
  import RoomPreview from "$lib/components/Main/Shared/RoomPreview/RoomPreview.svelte"
</script>

<RoomPreview
  roomId={page.params.roomId}
  isOwnRoomListing={page.url.searchParams.has("landlord")}
  room={$rooms?.[page.params.roomId]}
/>


<style>
  .slide-container {
    overflow: hidden;
    width: 100%;
  }
</style>