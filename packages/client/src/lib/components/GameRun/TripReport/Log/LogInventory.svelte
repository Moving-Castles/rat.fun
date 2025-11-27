<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { frozenRat } from "$lib/components/GameRun/state.svelte"
  import { items } from "$lib/modules/state/stores"
  import type { TempItem } from "$lib/components/GameRun/types"

  let {
    delay = 0,
    onTimeline
  }: {
    delay?: number
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Timeline
  const timeline = gsap.timeline({ delay })

  // Element refs
  let labelElement = $state<HTMLDivElement | null>(null)
  let itemElements = $state<HTMLDivElement[]>([])
  let emptyElement = $state<HTMLDivElement | null>(null)

  // Get inventory items from frozen rat
  let inventoryItems = $derived(frozenRat?.inventory ?? [])
  let hasItems = $derived(inventoryItems.length > 0)

  // Helper to get item name - handles both string (item ID) and TempItem types
  function getItemName(item: string | TempItem): string {
    if (typeof item === "string") {
      // It's an item ID, look up name from items store
      const itemData = $items[item]
      return itemData?.name ?? "Unknown"
    }
    return item.name
  }

  onMount(() => {
    if (onTimeline) {
      // Animate label first
      if (labelElement) {
        timeline.to(labelElement, {
          opacity: 1,
          duration: 0.15,
          ease: "power2.out"
        })
      }

      // Then animate each item sequentially, or the empty div
      if (hasItems && itemElements.length > 0) {
        itemElements.forEach(el => {
          timeline.to(el, {
            opacity: 1,
            duration: 0.15,
            ease: "power2.out"
          })
        })
      } else if (emptyElement) {
        timeline.to(emptyElement, {
          opacity: 1,
          duration: 0.15,
          ease: "power2.out"
        })
      }

      onTimeline(timeline)
    }
  })
</script>

<div class="log-inventory">
  <div class="inventory-content">
    <div class="label" bind:this={labelElement}>Rat enters with:</div>
    {#if hasItems}
      {#each inventoryItems as item, i}
        <div class="item" bind:this={itemElements[i]}>
          {getItemName(item)}
        </div>
      {/each}
    {:else}
      <div class="empty" bind:this={emptyElement}>No PsychoObjects</div>
    {/if}
  </div>
</div>

<style lang="scss">
  .log-inventory {
    display: flex;
    margin-bottom: 0.5em;
    line-height: 1.2em;
    font-size: var(--font-size-normal);

    .inventory-content {
      display: flex;
      flex-wrap: wrap;
      color: var(--foreground);
      font-family: var(--typewriter-font-stack);

      .label {
        opacity: 0;
        padding: 5px;
        margin-right: 0.5em;
        background: var(--background-semi-transparent);
      }

      .item {
        opacity: 0;
        padding: 5px;
        color: black;
        background: yellow;
        margin-right: 0.5em;
      }

      .empty {
        opacity: 0;
        padding: 5px;
        color: black;
        background: lightgray;
      }
    }
  }
</style>
