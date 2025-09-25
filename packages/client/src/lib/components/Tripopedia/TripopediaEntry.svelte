<script lang="ts">
  import type { Room as RoomSanityDoc, Outcome as OutcomeSanityDoc } from "@sanity-types"

  let { room, result }: { room: RoomSanityDoc | undefined; result: OutcomeSanityDoc | undefined } =
    $props()
</script>

<div class="tripopedia-entry">
  {#if room && result}
    <h1>ROOM PROMPT: {room.prompt}</h1>
    <p>RAT ID: {result.ratId}</p>
    <p>PLAYER ID: {result.playerId}</p>
    <div class="tripopedia-entry-content">
      {#each result.log ?? [] as item}
        <p>{item.event}</p>
      {/each}
    </div>
  {/if}
</div>
