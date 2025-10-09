<script lang="ts">
  import type { Hex } from "viem"
  import { Trip } from "$lib/components/GameRun"

  let { data }: { data: { tripId: Hex } } = $props()
</script>

<Trip tripId={data.tripId} />
