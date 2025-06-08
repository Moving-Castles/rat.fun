<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { client } from "@modules/content/sanity"
  import { queries } from "@modules/content/sanity/groq"
  import OutcomeMessage from "./OutcomeMessageTemp.svelte"
  import { publicNetwork } from "@modules/network"
  import type { Outcome } from "@sanity-types"

  let {
    roomId,
    initialOutcomes,
  }: { roomId: string; initialOutcomes: Outcome[] } = $props()

  let subscription = $state<any>(null)
  let outcomes = $state(initialOutcomes.reverse())

  const query = queries.outcomesForRoom
  const params = { roomId, worldAddress: $publicNetwork.worldAddress }

  const callback = (update: Outcome[]) => {
    if (!outcomes) {
      console.error("Outcomes is undefined")
      return
    }
    if (update.length > 0) {
      outcomes = update.reverse()
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
    border-left: 1px solid var(--color-grey-mid);
    border-right: 1px solid var(--color-grey-mid);
    border-bottom: 1px solid var(--color-grey-mid);
    font-size: 10px;
  }

  .logs {
    padding: 12px;
    display: flex;
    flex-flow: column nowrap;
    gap: 4px;
    padding-bottom: 60px;
  }

  .header {
    border-bottom: 1px dashed var(--color-grey-mid);
    padding: 12px;
    display: flex;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: var(--background);
  }
</style>
