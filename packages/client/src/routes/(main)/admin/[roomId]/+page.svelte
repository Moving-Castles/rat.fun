<script lang="ts">
  import type { Hex } from "viem"
  import { rooms } from "$lib/modules/state/stores"
  import { page } from "$app/state"
  import { SEO } from "$lib/components/Shared"
  import { AdminRoomPreview } from "$lib/components/Admin"

  let { data } = $props()

  let prompt = $derived($rooms?.[page.params.roomId as Hex]?.prompt || "")
  let truncatedTitle = $derived(prompt?.length > 32 ? `${prompt?.slice(0, 32)}...` : prompt)
  let room = $derived($rooms?.[page.params.roomId as Hex])

  console.log("### routes/(main)/admin/[roomId]/+page.svelte ###")
</script>

<SEO prependTitle={truncatedTitle} />

{#if room}
  <AdminRoomPreview
    sanityRoomContent={data.roomContent}
    roomId={page.params.roomId as Hex}
    {room}
  />
{/if}
