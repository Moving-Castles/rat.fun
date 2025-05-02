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
  {#if event.topic == "room__creation"}
    <!-- ROOM CREATION -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp)),
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    created a room
  {:else if event.topic == "room__liquidation"}
    <!-- ROOM LIQUIDATION -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp)),
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    destroyed a room
  {:else if event.topic == "room__outcome"}
    <!-- ROOM OUTCOME -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp)),
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    sent {event.ratName} to room.
    {event.message}
  {:else if event.topic == "rat__death"}
    <!-- DEATH IN ROOM -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp)),
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    {event.ratName} died in room
  {:else if event.topic == "rat__deploy"}
    <!-- DEPLOY -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp)),
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    deployed {event.ratName}
  {:else if event.topic == "rat__liquidate"}
    <!-- LIQUIDATE -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp)),
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    liquidated {event.ratName}
  {:else}
    <!-- FALLBACK -->
    <span class="message-body">
      {event.topic}: {event.message}
    </span>
  {/if}
</div>

<style lang="scss">
  .chat-event {
    display: inline-block;
    font-size: var(--font-size-small);
    line-height: 1.6;

    &.room__creation {
      color: var(--color-health);

      .timestamp {
        background: var(--color-health);
        color: var(--background);
        padding: 2px;
      }
    }

    &.room__liquidation {
      color: var(--color-death);

      .timestamp {
        background: var(--color-death);
        color: var(--background);
        padding: 2px;
      }
    }

    &.rat__deploy {
      color: var(--color-health);

      .timestamp {
        background: var(--color-health);
        color: var(--background);
        padding: 2px;
      }
    }

    &.room__outcome {
      color: var(--color-alert-priority);

      .timestamp {
        background: var(--color-alert-priority);
        color: var(--background);
        padding: 2px;
      }
    }

    &.rat__death {
      color: var(--color-death);

      .timestamp {
        background: var(--color-death);
        color: var(--background);
        padding: 2px;
      }
    }

    &.rat__liquidate {
      color: var(--color-death);

      .timestamp {
        background: var(--color-death);
        color: var(--background);
        padding: 2px;
      }
    }

    .timestamp {
      display: inline;
    }
  }
</style>
