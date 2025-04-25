<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  // import { rooms } from "@modules/state/base/stores"
  import { client } from "@modules/content/sanity"
  import { queries } from "@modules/content/sanity/groq"

  let { room, initialOutcomes } = $props()

  let subscription = $state<any>(null)
  let outcomes = $state(initialOutcomes)

  const query = queries.outcomesForRoom
  const params = { roomId: room._id }

  onMount(() => {
    console.log("watch for changes")

    subscription = client.listen(query, params).subscribe(update => {
      console.log(update.result?._id)
      console.log(outcomes.map(o => o._id))
      if (!outcomes.map(o => o._id).includes(update?.result?._id)) {
        // console.log("adding to outcome")
        // outcomes.set([...outcomes, update.result])
        outcomes.push(update.result)
      }
    })
  })

  onDestroy(() => {
    console.log("unsubscribe")
    subscription?.unsubscribe()
  })
</script>

<div class="outcomes">
  {#each outcomes as outcome (outcome._id)}
    <div class="outcome">
      {outcome._createdAt}
      {outcome.ratName} entered.
      {outcome.ratValue}
      {outcome.ratValueChange}
      {outcome.ratHealth}
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
</style>
