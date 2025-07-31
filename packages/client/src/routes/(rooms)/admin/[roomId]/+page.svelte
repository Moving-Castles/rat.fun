<script lang="ts">
  import type { Hex } from "viem"
  import { rooms } from "$lib/modules/state/stores"
  import { page } from "$app/state"
  import { RoomPreview, SEO } from "$lib/components/Shared"

  let { data } = $props()

  let prompt = $derived($rooms?.[page.params.roomId]?.prompt || "")
  let truncatedTitle = $derived(prompt?.length > 32 ? `${prompt?.slice(0, 32)}...` : prompt)
  let room = $derived($rooms?.[page.params.roomId])
</script>

<SEO prependTitle={truncatedTitle} />

{#if room}
  <RoomPreview
    sanityRoomContent={data.roomContent}
    roomId={page.params.roomId as Hex}
    isOwnRoomListing={true}
    {room}
  />
{/if}
