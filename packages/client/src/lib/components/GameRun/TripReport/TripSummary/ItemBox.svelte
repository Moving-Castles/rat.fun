<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { frozenRat } from "$lib/components/GameRun/state.svelte"
  import { getRatInventory } from "$lib/modules/state/utils"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { gsap } from "gsap"

  let {
    result,
    onTimeline
  }: {
    result: EnterTripReturnValue
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>, offset: number | string) => void
  } = $props()

  let itemsElement = $state<HTMLDivElement | null>(null)

  const ratDead = $derived(result.ratDead)

  // If rat is dead we show all items as removed
  // Technically they are not removed from the onchain entity
  const empty = $derived(!ratDead && result.itemChanges?.length === 0)

  // No items are added if the rat is dead
  const addedItems = $derived(
    ratDead ? [] : result.itemChanges?.filter(item => item.type === "add")
  )
  // All items are removed if the rat is dead
  const removedItems = $derived(
    ratDead
      ? (getRatInventory(frozenRat) ?? [])
      : result.itemChanges?.filter(item => item.type === "remove")
  )

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    gsap.set(itemsElement, { opacity: 0 })
  }

  const main = () => {
    timeline.to(itemsElement, {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    })
  }

  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline, 0)
    }
  }

  const run = () => {
    prepare()
    main()
    done()
  }

  $effect(() => {
    if (itemsElement) {
      run()
    }
  })
</script>

<!-- ITEMS -->
<div class="items" bind:this={itemsElement} class:empty>
  {#each addedItems as itemChange}
    <div class="item add">
      {itemChange.name} (+{itemChange.value}
      {CURRENCY_SYMBOL})
    </div>
  {/each}
  {#each removedItems as itemChange}
    <div class="item remove">
      {itemChange.name} (-{itemChange.value}
      {CURRENCY_SYMBOL})
    </div>
  {/each}
</div>

<style lang="scss">
  .items {
    border: 1px solid var(--foreground);
    border-bottom: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: 80px;

    &.empty {
      display: none;
    }

    .item {
      padding: 10px;
      color: var(--background);
      margin-right: 10px;

      &.add {
        background: var(--color-good);
      }
      &.remove {
        background: var(--color-bad);
      }
    }
  }
</style>
