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

<div id={event.id} class="trip__outcome">
  <ChatEvent_Label {event} />
  sent <span class="rat-name">{event.ratName}</span> to trip
  <a href="/{event.tripId}">#{event.tripIndex ?? "unknown"}.</a>
</div>

<style lang="scss">
  .trip__outcome {
    color: var(--color-alert);
    font-size: var(--font-size-small);
    line-height: 1.6;

    a,
    a:visited {
      color: inherit;
    }
  }
</style>
