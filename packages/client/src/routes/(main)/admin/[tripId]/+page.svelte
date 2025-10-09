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
  <AdminTripPreview
    sanityTripContent={data.tripContent}
    tripId={page.params.tripId as Hex}
    {trip}
  />
{/if}
