<script lang="ts">
  import type { Hex } from "viem"
  import { rooms } from "$lib/modules/state/base/stores"
  import { page } from "$app/state"
  import { RoomPreview, SEO } from "$lib/components/Shared"

  let prompt = $derived($rooms?.[page.params.roomId]?.prompt)
  let truncatedTitle = $derived(prompt.length > 32 ? `${prompt?.slice(0, 32)}...` : prompt)
</script>

<SEO prependTitle={truncatedTitle} />

<RoomPreview
  roomId={page.params.roomId as Hex}
  isOwnRoomListing={page.url.searchParams.has("landlord")}
  room={$rooms?.[page.params.roomId]}
/>
