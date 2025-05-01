<script lang="ts">
  import type { OffChainMessage } from "@server/modules/websocket/types"

  import { onMount } from "svelte"
  import { formatDate } from "@modules/utils"
  import { tippy } from "svelte-tippy"
  import { playSound } from "@modules/sound"

  let { event }: { event: OffChainMessage } = $props()

  onMount(() => {
    playSound("tcm", "selectionScroll2")
  })
</script>

<div class="chat-event {event.topic}">
  {#if event.topic !== "room__outcome"}
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp)),
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
  {/if}
  <span class="message-body">
    {event.message}
  </span>
</div>

<style lang="scss">
  .chat-event {
    display: inline-block;
    font-size: var(--font-size-small);

    &.room__creation {
      color: var(--color-health);
    }

    &.room__outcome {
      color: var(--color-alert);
    }

    &.rat__death {
      color: var(--color-death);
    }

    .timestamp {
      display: inline;
    }
  }
</style>
