<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  // import { rooms } from "@modules/state/base/stores"
  import { client } from "@modules/content/sanity"
  import { queries } from "@modules/content/sanity/groq"
  import { formatDate } from "@modules/utils"

  let { room, initialOutcomes } = $props()

  let subscription = $state<any>(null)
  let outcomes = $state(initialOutcomes)

  const query = queries.outcomesForRoom
  const params = { roomId: room._id }

  const callback = update => {
    if (!outcomes) {
      console.error("Outcomes is undefined")
      return
    }

    if (!outcomes.map(o => o._id).includes(update?.result?._id)) {
      outcomes.push(update.result)
    }
  }

  onMount(() => {
    subscription = client.listen(query, params).subscribe(callback)
  })

  onDestroy(() => {
    subscription?.unsubscribe()
  })
</script>

<div class="outcomes">
  {#each outcomes as outcome (outcome._id)}
    <div class="log-entry">
      <span class="timestamp">
        {formatDate(new Date(outcome._createdAt))}
      </span>
      {outcome.outcomeMessage}
    </div>
  {/each}
</div>

<style lang="scss">
  .outcomes {
    margin-bottom: 12px;
  }
  .outcome {
    display: block;
    margin-bottom: 12px;
  }

  .log-entry {
    display: block;
    margin-bottom: 0.5em;
    line-height: 1.4em;

    .timestamp {
      background: var(--color-grey-light);
      padding: 5px;
      color: black;
      display: inline-block;
    }
  }
</style>
