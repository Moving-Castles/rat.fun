<script lang="ts">
  import type { Hex } from "viem"
  import { rooms } from "$lib/modules/state/stores"
  import { page } from "$app/state"
  import { RoomSEO } from "$lib/components/Room"
  import { RoomPreview } from "$lib/components/Shared"

  let { data } = $props()
</script>

<RoomSEO room={data.roomContent} />

{#if data.roomContent}
  <RoomPreview
    roomId={page.params.roomId as Hex}
    isOwnRoomListing={false}
    room={data.roomContent}
  />
{/if}
