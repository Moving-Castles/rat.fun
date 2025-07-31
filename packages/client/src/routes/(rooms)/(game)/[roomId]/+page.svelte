<script lang="ts">
  import type { Hex } from "viem"
  import { rooms } from "$lib/modules/state/stores"
  import { page } from "$app/state"
  import { RoomSEO } from "$lib/components/Room"
  import { GameRoomPreview } from "$lib/components/Shared"

  let { data } = $props()

  $inspect(data)

  let room = $derived($rooms[page.params.roomId as Hex])
</script>

<RoomSEO room={data.roomContent} />

{#if room && data.roomContent}
  <GameRoomPreview {room} roomId={page.params.roomId as Hex} sanityRoomContent={data.roomContent} />
{/if}
