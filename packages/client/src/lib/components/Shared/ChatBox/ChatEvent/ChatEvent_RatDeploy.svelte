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

<div id={event.id} class="rat__deploy">
  <ChatEvent_Label {event} />
  deployed <span class="rat-name">{event.ratName}</span>
</div>

<style lang="scss">
  .rat__deploy {
    color: var(--color-success);
    font-size: var(--font-size-small);
    line-height: 1.6;
  }
</style>
