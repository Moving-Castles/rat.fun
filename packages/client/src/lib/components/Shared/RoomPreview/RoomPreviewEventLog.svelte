<script lang="ts">
  import type { Outcome } from "@sanity-types"
  import type { Hex } from "viem"

  import { RoomEventLog } from "$lib/components/Shared"

  let { roomId, roomOutcomes }: { roomId: Hex; roomOutcomes?: Outcome[] } = $props()
</script>

{#if roomOutcomes}
  <div class="room-preview-event-log">
    <RoomEventLog {roomId} initialOutcomes={roomOutcomes} />
  </div>
{/if}

<style lang="scss">
  .room-preview-event-log {
    background: var(--background-semi-transparent);
  }
</style>
