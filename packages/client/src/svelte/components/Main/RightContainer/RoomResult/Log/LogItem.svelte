<script lang="ts">
  import type { LogEntry } from "@components/Main/RightContainer/RoomResult/types"
  import { fade } from "svelte/transition"
  import { playSound } from "@modules/sound"

  let { logEntry, i }: { logEntry: LogEntry; i: number } = $props()

  const parseTimestamp = str => {
    let datetime = new Date("1970-01-01T00:" + str + "Z").getTime()
    console.log(datetime, "millis")
    return datetime / 1000
  }

  let millis = $derived(parseTimestamp(logEntry.timestamp))

  $effect(() => {
    setTimeout(() => playSound("tcm", "selectionScroll"), millis * 100)
  })
</script>

{#if i > -1}
  <div in:fade|global={{ delay: millis * 100 }} class="log-entry">
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
