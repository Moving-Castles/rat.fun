<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  // import { rooms } from "@modules/state/base/stores"
  import { client } from "@modules/content/sanity"
  import { queries } from "@modules/content/sanity/groq"
  import OutcomeMessage from "../OutcomeMessage/OutcomeMessage.svelte"
  import { publicNetwork } from "@modules/network"

  let { roomId, initialOutcomes } = $props()

  let subscription = $state<any>(null)
  let outcomes = $state(initialOutcomes)

  const query = queries.outcomesForRoom
  const params = { roomId, worldAddress: $publicNetwork.worldAddress }

  const callback = update => {
    if (!outcomes) {
      console.error("Outcomes is undefined")
      return
    }

    if (!outcomes.map(o => o._id).includes(update?.result?._id)) {
      outcomes.pop(update.result)
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
  <div class="header">ROOM LOGS</div>
  <div class="logs">
    {#each outcomes as outcome (outcome._id)}
      <OutcomeMessage {outcome} />
    {/each}
  </div>
</div>

<style lang="scss">
  .outcomes {
    margin-bottom: 12px;
    max-height: 200px;
    overflow-y: scroll;
    overscroll-behavior-y: none;
    border: 1px solid var(--color-grey-mid);
    font-size: 10px;
  }

  .outcome {
    display: block;
    margin-bottom: 12px;
  }

  .logs {
    padding: 12px;
    display: flex;
    flex-flow: column nowrap;
    gap: 4px;
  }

  .header {
    border-bottom: 1px dashed var(--color-grey-mid);
    padding: 12px;
    display: flex;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: black;
  }
</style>
