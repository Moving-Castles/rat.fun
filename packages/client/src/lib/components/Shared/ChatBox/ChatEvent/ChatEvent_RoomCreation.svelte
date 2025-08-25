<script lang="ts">
  import { onMount } from "svelte"
  import { playSound } from "$lib/modules/sound"
  import type { OffChainMessage } from "@server/modules/types"
  import ChatEvent_Label from "./ChatEvent_Label.svelte"

  let { event, suppressSound = false }: { event: OffChainMessage; suppressSound?: boolean } =
    $props()

  onMount(() => {
    if (!suppressSound) {
      playSound("ratfun", "selectionScroll")
    }
  })
</script>

<div id={event.id} class="room__creation">
  <ChatEvent_Label {event} />
  created trip <a href="/{event.roomId}">#{event.roomIndex ?? "unknown"}</a>
</div>

<style lang="scss">
  .room__creation {
    color: var(--color-success);
    font-size: var(--font-size-small);
    line-height: 1.6;

    a,
    a:visited {
      color: inherit;
    }
  }
</style>
