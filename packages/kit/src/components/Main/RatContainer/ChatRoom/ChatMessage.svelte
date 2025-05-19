<script lang="ts">
  import type { OffChainMessage } from "@server/modules/types"
  import { onMount } from "svelte"
  import { formatDate } from "@modules/utils"
  import { tippy } from "svelte-tippy"
  import { playSound } from "@modules/sound"

  let {
    event,
    suppressSound = false,
  }: { event: OffChainMessage; suppressSound?: boolean } = $props()

  onMount(() => {
    if (!suppressSound) {
      playSound("tcm", "selectionScroll")
    }
  })
</script>

<div id={event.id} class="chat-message">
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
  .chat-message {
    display: block;
    font-size: var(--font-size-small);
    line-height: 1.6;

    .timestamp {
      background: var(--color-grey-light);
      color: var(--background);
      padding: 2px;
    }

    .message-body {
      color: var(--foreground);
    }
  }
</style>
