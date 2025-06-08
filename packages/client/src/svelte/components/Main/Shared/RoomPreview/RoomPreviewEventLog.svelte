<script lang="ts">
  import type { Outcome } from "@sanity-types"
  import type { Hex } from "viem"

  import RoomEventLog from "@components/Main/Shared/RoomEventLog/RoomEventLog.svelte"

  let { roomId, roomOutcomes }: { roomId: Hex; roomOutcomes?: Outcome[] } =
    $props()
</script>

{#if roomOutcomes}
  <div class="room-preview-event-log">
    <RoomEventLog {roomId} initialOutcomes={roomOutcomes} />
  </div>
{/if}
