<script lang="ts">
  import type { OffChainMessage } from "@server/modules/websocket/types"
  import { formatDate } from "@modules/utils"
  import { tippy } from "svelte-tippy"

  let { event }: { event: OffChainMessage } = $props()
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

    &.room__creation {
      background: var(--color-alert);
    }

    &.room__outcome {
      background: var(--color-grey-dark);
      color: var(--color-grey-light);
    }

    .timestamp {
      display: inline;
    }

    &.chat__message {
      .timestamp {
        background: var(--color-grey-light);
        // padding: 5px;
        color: black;
      }
      .message-body {
        color: var(--color-grey-mid);
      }
    }
  }
</style>
