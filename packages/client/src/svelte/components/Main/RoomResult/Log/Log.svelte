<script lang="ts">
  import type { LogEntry } from "@components/Main/RoomResult/types"
  import LogItem from "@components/Main/RoomResult/Log/LogItem.svelte"
  export let log: LogEntry[]
</script>

<div class="log">
  {#each log as logEntry, i (i)}
    <LogItem {logEntry} {i} />
  {/each}
</div>

<style lang="scss">
  .log {
    margin-bottom: 20px;
    line-height: 1.3em;
  }
</style>
