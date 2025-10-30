<script lang="ts">
  import { onMount } from "svelte"
  // import { playSound } from "$lib/modules/sound"
  import type { OffChainMessage } from "@websocket-server/modules/types"
  import ChatEvent_Label from "./ChatEvent_Label.svelte"

  let { event, suppressSound = false }: { event: OffChainMessage; suppressSound?: boolean } =
    $props()

  onMount(() => {
    if (!suppressSound) {
      // playSound("ratfunUI", "selectionScroll")
    }
  })
</script>

<div id={event.id} class="rat__death">
  <ChatEvent_Label {event} />
  let <span class="rat-name">{event.ratName}</span> die in trip
  <a href="/{event.tripId}">#{event.tripIndex ?? "unknown"}</a>
</div>

<style lang="scss">
  .rat__death {
    color: var(--color-death);
    font-size: var(--font-size-small);
    line-height: 1.6;

    a,
    a:visited {
      color: inherit;
    }
  }
</style>
