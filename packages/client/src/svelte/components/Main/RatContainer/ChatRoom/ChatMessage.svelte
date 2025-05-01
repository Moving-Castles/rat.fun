<script lang="ts">
  import type { OffChainMessage } from "@server/modules/websocket/types"
  import { onMount } from "svelte"
  import { formatDate } from "@modules/utils"
  import { tippy } from "svelte-tippy"
  import { playSound } from "@modules/sound"

  let { event }: { event: OffChainMessage } = $props()

  onMount(() => {
    playSound("tcm", "selectionScroll")
  })
</script>

<div class="chat-event {event.topic}">
  <span
    use:tippy={{
      content: formatDate(new Date(event.timestamp)),
    }}
    class="timestamp"
  >
    {event.playerName}
  </span>
  <span class="message-body">
    {event.message}
  </span>
</div>

<style lang="scss">
  .chat-event {
    display: inline-block;

    .timestamp {
      background: var(--color-grey-light);
      color: black;
    }

    .message-body {
      color: var(--foreground);
    }
  }
</style>
