<script lang="ts">
  import type { Room as RoomSanityDoc, Outcome as OutcomeSanityDoc } from "@sanity-types"

  let { room, result }: { room: RoomSanityDoc; result: OutcomeSanityDoc } = $props()
</script>

<div class="tripopedia-entry">
  <h1>{room.prompt}</h1>
  <div class="tripopedia-entry-content">
    {#each result.log ?? [] as item}
      <p>{item.event}</p>
    {/each}
  </div>
</div>
