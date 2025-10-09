<script lang="ts">
  import type { Outcome } from "@sanity-types"
  import { onMount, onDestroy } from "svelte"
  import { client } from "$lib/modules/content/sanity"
  import { queries } from "$lib/modules/content/sanity/groq"
  import OutcomeMessage from "./OutcomeMessage.svelte"
  import { publicNetwork } from "$lib/modules/network"
  import { staticContent } from "$lib/modules/content"
  import { errorHandler, CMSError } from "$lib/modules/error-handling"

  let { tripId }: { tripId: string; initialOutcomes: Outcome[] } = $props()

  let subscription = $state<any>(null)

  const query = queries.outcomesForTrip
  const params = { tripId, worldAddress: $publicNetwork.worldAddress }

  let tripOutcomes = $derived($staticContent?.outcomes?.filter(o => o.tripId == tripId) || [])

  const callback = (mutationEvent: any) => {
    if (!tripOutcomes) {
      errorHandler(new CMSError("Trip outcomes is undefined"))
      return
    }
    if (mutationEvent.result) {
      // Note: tripOutcomes is derived, so we can't assign to it directly
      // This might need a different approach depending on the intended behavior
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
  <div class="header">TRIP LOGS</div>
  {#if tripOutcomes.length > 0}
    <div class="logs">
      {#each tripOutcomes.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()) as outcome (outcome._id)}
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
    max-height: 340px;
    overflow-y: scroll;
    overscroll-behavior-y: none;
    border-left: 1px solid var(--color-grey-mid);
    border-right: 1px solid var(--color-grey-mid);
    border-bottom: 1px solid var(--color-grey-mid);
    font-size: var(--font-size-normal);
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
    height: 300px;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;

    span {
      font-size: var(--font-size-normal);
      background: var(--color-death);
      padding: 2px;
      color: var(--background);
    }
  }

  .header {
    border-bottom: 1px dashed var(--color-grey-mid);
    padding: 12px;
    font-size: var(--font-size-normal);
    display: flex;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: var(--background);
  }
</style>
