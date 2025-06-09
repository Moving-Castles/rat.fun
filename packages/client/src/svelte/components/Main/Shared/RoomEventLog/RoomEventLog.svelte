<script lang="ts">
  import type { Outcome } from "@sanity-types"
  import { onMount, onDestroy } from "svelte"
  import { client } from "@modules/content/sanity"
  import { queries } from "@modules/content/sanity/groq"
  import OutcomeMessage from "./OutcomeMessageTemp.svelte"
  import { publicNetwork } from "@modules/network"
  import { staticContent } from "@modules/content"

  let {
    roomId,
    initialOutcomes,
  }: { roomId: string; initialOutcomes: Outcome[] } = $props()

  let subscription = $state<any>(null)

  const query = queries.outcomesForRoom
  const params = { roomId, worldAddress: $publicNetwork.worldAddress }

  let roomOutcomes = $derived(
    $staticContent.outcomes.filter(o => o.roomId == roomId) || []
  )

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
  {#if roomOutcomes.length > 0}
    <div class="logs">
      {#each roomOutcomes as outcome (outcome._id)}
        <OutcomeMessage {outcome} />
      {/each}
    </div>
  {:else}
    <div class="logs-empty">
      <span> NO LOGS </span>
    </div>
  {/if}
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
    background-image: url("/images/texture-5.png");
    background-size: 100px;
  }

  .logs {
    padding: 12px;
    display: flex;
    flex-flow: column nowrap;
    gap: 4px;
    padding-bottom: 60px;
  }

  .logs-empty {
    height: 100px;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;

    span {
      font-size: 14px;
      background: var(--color-death);
      padding: 2px;
      color: var(--background);
    }
  }

  .header {
    border-bottom: 1px dashed var(--color-grey-mid);
    padding: 12px;
    font-size: 11px;
    display: flex;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: var(--background);
  }
</style>
