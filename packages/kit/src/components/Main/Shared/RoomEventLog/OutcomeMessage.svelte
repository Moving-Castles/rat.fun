<script lang="ts">
  import { timeSince } from "@modules/utils"
  import { onMount, onDestroy } from "svelte"

  let interval: ReturnType<typeof setInterval>

  let { outcome } = $props()

  console.log(outcome)

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

<div class="log-entry">
  <span class="timestamp">
    {elapsed}
    {ago}
  </span>
  {outcome.ratName} entered {outcome.roomIndex}.
  {outcome.outcomeMessage}
</div>

<style lang="scss">
  .log-entry {
    display: block;
    margin-bottom: 0.5em;
    line-height: 1.4em;

    color: var(--color-alert-priority);
    .timestamp {
      background: var(--color-alert-priority);
      color: var(--background);
      padding: 2px;
    }
  }
</style>
