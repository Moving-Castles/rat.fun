<script lang="ts">
  import type { Trip as TripSanityDoc, Outcome as OutcomeSanityDoc } from "@sanity-types"

  import { TripopediaEntry } from "$lib/components/Tripopedia"

  let { data }: { data: { trip: TripSanityDoc; result: OutcomeSanityDoc } } = $props()
  let { trip, result } = data
</script>

<TripopediaEntry {trip} {result} />
