<script lang="ts">
  import type { OffChainMessage } from "@server/modules/types"

  import { onMount } from "svelte"
  import { formatDate } from "$lib/modules/utils"
  import { tippy } from "svelte-tippy"
  import { playSound } from "$lib/modules/sound"

  let { event, suppressSound = false }: { event: OffChainMessage; suppressSound?: boolean } =
    $props()

  onMount(() => {
    if (!suppressSound) {
      playSound("tcm", "selectionScroll2")
    }
  })
</script>

<div id={event.id} class="chat-event {event.topic}">
  {#if event.topic == "room__creation"}
    <!-- ROOM CREATION -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp))
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    created room <a href="/rat/{event.roomId}">#{event.roomIndex ?? "unknown"}</a>
  {:else if event.topic == "room__liquidation"}
    <!-- ROOM LIQUIDATION -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp))
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    destroyed room <a href="/rat/{event.roomId}">#{event.roomIndex ?? "unknown"}</a>
  {:else if event.topic == "room__outcome"}
    <!-- ROOM OUTCOME -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp))
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    sent <span class="rat-name">{event.ratName}</span> to room
    <a href="/rat/{event.roomId}">#{event.roomIndex ?? "unknown"}.</a>
    {event.message}
  {:else if event.topic == "rat__death"}
    <!-- DEATH IN ROOM -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp))
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    let <span class="rat-name">{event.ratName}</span> die in room
    <a href="/rat/{event.roomId}">#{event.roomIndex ?? "unknown"}</a>
  {:else if event.topic == "rat__deploy"}
    <!-- DEPLOY -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp))
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    deployed <span class="rat-name">{event.ratName}</span>
  {:else if event.topic == "rat__liquidate"}
    <!-- LIQUIDATE -->
    <span
      use:tippy={{
        content: formatDate(new Date(event.timestamp))
      }}
      class="timestamp"
    >
      {event.playerName}
    </span>
    liquidated <span class="rat-name">{event.ratName}</span>
  {:else}
    <!-- FALLBACK -->
    <span class="message-body">
      {event.topic}: {event.message}
    </span>
  {/if}
</div>

<style lang="scss">
  .chat-event {
    display: block;
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
      color: var(--color-alert);

      .timestamp {
        background: var(--color-alert);
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

  a,
  a:visited {
    color: inherit;
  }

  .rat-name {
    // background: var(--background);
    // color: var(--foreground);
    // border: var(--default-border-style);
    // padding: 2px;
  }
</style>
