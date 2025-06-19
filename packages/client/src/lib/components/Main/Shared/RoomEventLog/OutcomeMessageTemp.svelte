<script lang="ts">
  import { tippy } from "svelte-tippy"
  import { timeSince } from "$lib/modules/utils"
  import { onMount, onDestroy } from "svelte"

  let interval: ReturnType<typeof setInterval>

  let { outcome } = $props()

  let topic = $derived.by(() => {
    if (outcome.ratHealth === 0) return "rat__death"
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

<div class="chat-event {topic}">
  {#if topic == "room__outcome"}
    <!-- ROOM OUTCOME -->
    <span
      use:tippy={{
        content: `${elapsed} ${ago}`,
      }}
      class="timestamp"
    >
      {outcome.playerName}
    </span>
    sent <span class="rat-name">{outcome.ratName}</span> to room #{outcome.roomIndex ??
      "unknown"}.
    {outcome.outcomeMessage}
  {:else if topic == "rat__death"}
    <!-- DEATH IN ROOM -->
    <span
      use:tippy={{
        content: `${elapsed} ${ago}`,
      }}
      class="timestamp"
    >
      {outcome.playerName}
    </span>
    let <span class="rat-name">{outcome.ratName}</span> die in room #{outcome.roomIndex ??
      "unknown"}
  {:else}
    <!-- FALLBACK -->
    <span class="message-body">
      {topic}: {outcome.outcomeMessage}
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
