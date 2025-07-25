<script lang="ts">
  import type { Hex } from "viem"
  import { rooms } from "$lib/modules/state/stores"
  import { page } from "$app/state"
  import { RoomSEO } from "$lib/components/Room"
  import { RoomPreview } from "$lib/components/Shared"

  let { data } = $props()

  console.log("WE HAVE DATA", data.roomContent)

  let room = $derived($rooms[page.params.roomId])
</script>

<RoomSEO room={data.roomContent} />

{#if room && data.roomContent}
  <RoomPreview
    {room}
    roomId={page.params.roomId as Hex}
    isOwnRoomListing={false}
    sanityRoomContent={data.roomContent}
  />
{/if}
