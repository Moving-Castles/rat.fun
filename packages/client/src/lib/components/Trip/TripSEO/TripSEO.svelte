<script lang="ts">
  import type { Trip } from "@sanity-types"
  import { SEO } from "$lib/components/Shared"
  import { urlFor } from "$lib/modules/content/sanity"

  let { trip }: { trip: Trip } = $props()

  let prompt = $derived(trip.prompt || "")
  let prependTitle = $derived(prompt.length > 32 ? `${prompt.slice(0, 32)}...` : prompt)
  let description = $derived(`Creator: ${trip.ownerName}. ${prompt}`)
  let imageUrl = $derived.by(() => {
    const result = urlFor(trip?.image?.asset)
    if (!result) {
      return result
    } else {
      return result.width(800).height(800).url()
    }
  })
  let imageWidth = $state("800")
  let imageHeight = $state("800")
</script>

<SEO {prependTitle} {description} {imageUrl} {imageWidth} {imageHeight} />
