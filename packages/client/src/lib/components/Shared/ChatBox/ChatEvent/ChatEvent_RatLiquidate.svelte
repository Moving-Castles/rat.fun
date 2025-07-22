<script lang="ts">
  import { onMount } from "svelte"
  import { playSound } from "$lib/modules/sound"
  import type { OffChainMessage } from "@server/modules/types"
  import ChatEvent_Label from "./ChatEvent_Label.svelte"

  let { event, suppressSound = false }: { event: OffChainMessage; suppressSound?: boolean } =
    $props()

  onMount(() => {
    if (!suppressSound) {
      playSound("tcm", "selectionScroll")
    }
  })
</script>

<div id={event.id} class="rat__liquidate">
  <ChatEvent_Label {event} />
  liquidated <span class="rat-name">{event.ratName}</span>
</div>

<style lang="scss">
  .rat__liquidate {
    color: var(--color-death);
    font-size: var(--font-size-small);
    line-height: 1.6;
  }
</style>
