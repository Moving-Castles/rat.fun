<script lang="ts">
  import { tippy } from "svelte-tippy"
  import { timeSince } from "$lib/modules/utils"
  import { onMount, onDestroy } from "svelte"
  import type { Outcome as OutcomeSanityDoc } from "@sanity-types"

  let interval: ReturnType<typeof setInterval>

  let { outcome }: { outcome: OutcomeSanityDoc } = $props()

  let topic = $derived.by(() => {
    if (outcome.ratBalance === 0) return "rat__death"
    return "room__outcome"
  })

  let tick = $state(1)
  let elapsed = $derived.by(() => {
    if (tick) {
      return timeSince(new Date(outcome._createdAt).getTime())
    } else {
      return "now"
    }
  })
  let ago = $derived(elapsed !== "now" ? "ago" : "")

  onMount(() => {
    interval = setInterval(() => tick++, 5000)
  })

  onDestroy(() => {
    clearInterval(interval)
  })
</script>

<!-- Deprecated; modal view #{outcome._id} -->
<a href="/{outcome.roomId}/result/{outcome._id}" class="chat-event {topic}">
  {#if topic == "room__outcome"}
    <!-- ROOM OUTCOME -->
    <span
      use:tippy={{
        content: `${elapsed} ${ago}`
      }}
      class="timestamp"
    >
      {outcome.playerName}
    </span>
    sent <span class="rat-name">{outcome.ratName}</span> to trip #{outcome.roomIndex ?? "unknown"}.
  {:else if topic == "rat__death"}
    <!-- DEATH IN ROOM -->
    <span
      use:tippy={{
        content: `${elapsed} ${ago}`
      }}
      class="timestamp"
    >
      {outcome.playerName}
    </span>
    let <span class="rat-name">{outcome.ratName}</span> die from trip #{outcome.roomIndex ??
      "unknown"}
  {:else}
    <!-- FALLBACK -->
    <span class="message-body">
      {topic}
    </span>
  {/if}
</a>

<style lang="scss">
  .chat-event {
    display: block;
    font-size: var(--font-size-small);
    line-height: 1.6;

    &.room__creation {
      color: var(--color-success);

      .timestamp {
        background: var(--color-success);
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
      color: var(--color-success);

      .timestamp {
        background: var(--color-success);
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
