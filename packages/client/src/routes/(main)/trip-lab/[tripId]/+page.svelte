<script lang="ts">
  import type { Hex } from "viem"
  import { trips } from "$lib/modules/state/stores"
  import { page } from "$app/state"
  import { SEO } from "$lib/components/Shared"
  import { AdminTripPreview } from "$lib/components/Admin"

  let { data } = $props()

  let prompt = $derived($trips?.[page.params.tripId as Hex]?.prompt || "")
  let truncatedTitle = $derived(prompt?.length > 32 ? `${prompt?.slice(0, 32)}...` : prompt)
  let trip = $derived($trips?.[page.params.tripId as Hex])
</script>

<SEO prependTitle={truncatedTitle} />

{#if trip}
  {#key data.tripId}
    <AdminTripPreview
      sanityTripContent={data.tripContent}
      liquidating={data.liquidating}
      tripId={page.params.tripId as Hex}
      {trip}
    />
  {/key}
{/if}
