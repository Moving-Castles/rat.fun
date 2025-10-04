<script lang="ts">
  import { onMount } from "svelte"
  // import { playSound } from "$lib/modules/sound"
  import type { OffChainMessage } from "@server/modules/types"
  import ChatEvent_Label from "./ChatEvent_Label.svelte"

  let { event, suppressSound = false }: { event: OffChainMessage; suppressSound?: boolean } =
    $props()

  onMount(() => {
    if (!suppressSound) {
      // playSound("ratfunUI", "selectionScroll")
    }
  })
</script>

<div id={event.id} class="key__activation">
  <ChatEvent_Label {event} />
  Supervisor mode activated
</div>

<style lang="scss">
  .key__activation {
    background: #dd00ff;
    color: var(--background);
    font-size: var(--font-size-small);
    line-height: 1.6;
    padding: 2px;
  }
</style>
