<script lang="ts">
  import type { Room } from "@sanity-types"
  import { SEO } from "$lib/components/Shared"
  import { urlFor } from "$lib/modules/content/sanity"

  let { room }: { room: Room } = $props()

  let prompt = $derived(room.prompt || "")
  let prependTitle = $derived(prompt.length > 32 ? `${prompt.slice(0, 32)}...` : prompt)
  let description = $derived(`Creator: ${room.ownerName}. ${prompt}`)
  let imageUrl = $derived(room?.image?.asset ? urlFor(room.image).width(800).height(800).url() : "")
  let imageWidth = $state("800")
  let imageHeight = $state("800")
</script>

<SEO {prependTitle} {description} {imageUrl} {imageWidth} {imageHeight} />
