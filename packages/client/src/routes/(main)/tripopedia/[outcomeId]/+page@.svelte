<script lang="ts">
  import type { Room as RoomSanityDoc, Outcome as OutcomeSanityDoc } from "@sanity-types"

  import { TripopediaEntry } from "$lib/components/Tripopedia"

  let { data }: { data: { room: RoomSanityDoc; result: OutcomeSanityDoc } } = $props()
  let { room, result } = data

  console.log("### routes/(main)/tripopedia/[outcomeId]/+page@.svelte ###")
  console.log("### room ###", room)
  console.log("### result ###", result)
</script>

<TripopediaEntry {room} {result} />
