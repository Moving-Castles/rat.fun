<script lang="ts">
  import { fly } from "svelte/transition"
  import { rooms } from "$lib/modules/state/base/stores"
  import { page } from "$app/state"
  import RoomPreview from "$lib/components/Main/Shared/RoomPreview/RoomPreview.svelte"
  import CenterBar from "$lib/components/Main/CenterBar/CenterBar.svelte"
  import RatContainer from "$lib/components/Main/RatContainer/RatContainer.svelte"
  import SEO from "$lib/components/Kit/SEO.svelte"

  let prompt = $derived($rooms?.[page.params.roomId]?.prompt)
  let truncatedTitle = $derived(prompt.length > 32 ? `${prompt?.slice(0, 32)}...` : prompt)
</script>

<SEO prependTitle={truncatedTitle} />

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
