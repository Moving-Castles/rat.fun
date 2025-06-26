<script lang="ts">
  import { rooms } from "$lib/modules/state/base/stores"
  import { page } from "$app/state"
  import RoomPreview from "$lib/components/Main/Shared/RoomPreview/RoomPreview.svelte"
  import SEO from "$lib/components/Kit/SEO.svelte"

  let prompt = $derived($rooms?.[page.params.roomId]?.prompt)
  let truncatedTitle = $derived(prompt.length > 32 ? `${prompt?.slice(0, 32)}...` : prompt)
</script>

<SEO prependTitle={truncatedTitle} />

<RoomPreview
  roomId={page.params.roomId}
  isOwnRoomListing={true}
  room={$rooms?.[page.params.roomId]}
/>

<style>
  .slide-container {
    overflow: hidden;
    width: 100%;
  }
</style>
