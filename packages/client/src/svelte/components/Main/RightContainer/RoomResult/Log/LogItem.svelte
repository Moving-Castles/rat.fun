<script lang="ts">
  import type { LogEntry } from "@components/Main/RightContainer/RoomResult/types"
  import { fade } from "svelte/transition"
  import { playSound } from "@modules/sound"

  let { logEntry, i }: { logEntry: LogEntry; i: number } = $props()

  const DELAY = 400

  $effect(() => {
    setTimeout(() => playSound("tcm", "selectionScroll"), i * DELAY)
  })
</script>

{#if i > -1}
  <div in:fade|global={{ delay: i * DELAY }} class="log-entry">
    <span class="timestamp">{logEntry.timestamp}</span> –
    <span class="event">{logEntry.event}</span>
  </div>
{/if}

<style lang="scss">
  .log-entry {
    .timestamp {
      color: var(--color-grey-light);
    }
  }
</style>
