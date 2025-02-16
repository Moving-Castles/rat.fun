<script lang="ts">
  import type { LogEntry } from "@components/Room/types"
  import LogItem from "@components/Room/Log/LogItem.svelte"
  export let log: LogEntry[]
</script>

<div class="log">
  {#each log as logEntry, i}
    <LogItem {logEntry} {i} />
  {/each}
</div>

<style lang="scss">
  .log {
    margin-bottom: 20px;
    font-size: var(--font-size-large);
    line-height: 1.3em;
  }
</style>
