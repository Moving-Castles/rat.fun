<script lang="ts">
  import { upcomingWorldEvent } from "$lib/modules/content"
  import { timeUntil, millisUntil } from "$lib/modules/utils"
  import { onMount, onDestroy } from "svelte"

  let tick = $state(1)
  let interval: ReturnType<typeof setInterval>
  let countdown = $derived.by(() => {
    if (tick) {
      return timeUntil(new Date($upcomingWorldEvent?.activationDateTime ?? "").getTime())
    } else {
      return "00:00:00"
    }
  })
  let almost = $derived(
    millisUntil(new Date($upcomingWorldEvent?.activationDateTime ?? "").getTime()) < 60000 &&
      tick % 2 === 0
  ) // one minute before

  onMount(() => {
    interval = setInterval(() => tick++, 1000)
  })

  onDestroy(() => {
    clearInterval(interval)
  })
</script>

<div class="upcoming-event" class:warning={almost} class:almost={!almost}>
  {countdown}<br />until the next world event
</div>

<style>
  .upcoming-event {
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    color: black;
    padding: 0 3rem;

    &.almost {
      background-color: black;
      color: var(--color-value);
    }
  }
</style>
