<script lang="ts">
  import type { Room as RoomSanityDoc, Outcome as OutcomeSanityDoc } from "@sanity-types"

  import { TripopediaEntry } from "$lib/components/Tripopedia"

  let { data }: { data: { room: RoomSanityDoc; result: OutcomeSanityDoc } } = $props()
  let { room, result } = data
</script>

<TripopediaEntry {room} {result} />
