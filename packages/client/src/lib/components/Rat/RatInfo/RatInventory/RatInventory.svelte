<script lang="ts">
  import { getRatInventory, type ItemWithId } from "$lib/modules/state/utils"
  import { gsap } from "gsap"
  import { playSound } from "$lib/modules/sound"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"

  import InventoryHeader from "$lib/components/Rat/RatInfo/RatInventory/InventoryHeader.svelte"
  import InteractiveItem from "$lib/components/Rat/RatInfo/RatInventory/InteractiveItem.svelte"
  import EmptySlot from "$lib/components/Rat/RatInfo/RatInventory/EmptySlot.svelte"

  let {
    displayRat,
    oldRat,
    newRat,
    onTimeline,
    enableExport = false,
    ratId,
    onExportComplete,
    nftCount = 0,
    onImportClick
  }: {
    displayRat: Rat | null
    oldRat: Rat | null
    newRat: Rat | null
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
    enableExport?: boolean
    ratId?: string
    onExportComplete?: () => void
    nftCount?: number
    onImportClick?: () => void
  } = $props()

  // Calculate old and new inventories for change detection
  let oldInventory = $derived<ItemWithId[]>(oldRat ? getRatInventory(oldRat) : [])
  let newInventory = $derived<ItemWithId[]>(newRat ? getRatInventory(newRat) : [])

  // Handle export item to NFT - transition to confirmation state
  const handleExportItem = (itemId: string) => {
    if (!displayRat) return

    // Find the item to get its details
    const item = newInventory.find(i => i.id === itemId)
    if (!item) return

    playSound({ category: "ratfunUI", id: "click" })
    ratState.exportItem.set(itemId, item.name, Number(item.value))
    ratState.state.transitionTo(RAT_BOX_STATE.CONFIRM_EXPORT_NFT)
  }

  // Detect changes
  const addedItems = $derived(
    newInventory.filter(newItem => !oldInventory.some(oldItem => oldItem.id === newItem.id))
  )
  const removedItems = $derived(
    oldInventory.filter(oldItem => !newInventory.some(newItem => newItem.id === oldItem.id))
  )
  const hasChanges = $derived(addedItems.length > 0 || removedItems.length > 0)

  const MAX_INVENTORY_SIZE = 6

  // Header values
  let filledSlots = $derived(newInventory.length)

  // Build combined slot list for animation
  // During changes: show old items + new items (will animate out/in)
  // During normal entry: show new items only
  type SlotItem = {
    item: ItemWithId | null
    type: "removed" | "added" | "unchanged" | "empty"
    originalIndex: number // Position in final grid
  }

  let inventorySlots = $derived.by(() => {
    const slots: SlotItem[] = []

    if (hasChanges) {
      // Show removed items first (they will animate out)
      removedItems.forEach((item, idx) => {
        slots.push({
          item,
          type: "removed",
          originalIndex: idx
        })
      })

      // Then show new items (they will animate in)
      newInventory.forEach((item, idx) => {
        slots.push({
          item,
          type: addedItems.some(added => added.id === item.id) ? "added" : "unchanged",
          originalIndex: idx
        })
      })

      // Fill remaining with empty slots
      const remaining = MAX_INVENTORY_SIZE - newInventory.length
      for (let i = 0; i < remaining; i++) {
        slots.push({
          item: null,
          type: "empty",
          originalIndex: newInventory.length + i
        })
      }
    } else {
      // Normal entry - just show current inventory
      newInventory.forEach((item, idx) => {
        slots.push({
          item,
          type: "unchanged",
          originalIndex: idx
        })
      })

      // Fill with empty slots
      const remaining = MAX_INVENTORY_SIZE - newInventory.length
      for (let i = 0; i < remaining; i++) {
        slots.push({
          item: null,
          type: "empty",
          originalIndex: newInventory.length + i
        })
      }
    }

    return slots
  })

  // Elements
  let inventoryContainer = $state<HTMLDivElement | null>(null)
  let slotElements: (HTMLDivElement | null)[] = $state([])

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    inventorySlots.forEach((slot, idx) => {
      const el = slotElements[idx]
      if (!el) return

      if (hasChanges && slot.type === "removed") {
        // Removed items start visible (will animate out)
        gsap.set(el, { opacity: 1, scale: 1 })
      } else {
        // All other items start invisible
        gsap.set(el, { opacity: 0, scale: 0.8 })
      }
    })
  }

  const main = () => {
    const validElements = slotElements.filter(el => el !== null)
    if (validElements.length === 0) return

    if (hasChanges) {
      // CHANGE ANIMATION

      // Step 1: Show old state (removed items are visible from prepare)
      // Wait 0.4s

      // Step 2: Animate out removed items
      inventorySlots.forEach((slot, idx) => {
        const el = slotElements[idx]
        if (!el || slot.type !== "removed") return

        timeline.to(
          el,
          {
            opacity: 0,
            scale: 0.5,
            duration: 0.4,
            ease: "power2.in"
          },
          0.4 // After 0.4s wait
        )
      })

      // Step 3: Animate in unchanged items (quick)
      inventorySlots.forEach((slot, idx) => {
        const el = slotElements[idx]
        if (!el || slot.type !== "unchanged") return

        timeline.to(
          el,
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          },
          0.6 // Slightly after removal starts
        )
      })

      // Step 4: Animate in added items (with pulse + sound)
      inventorySlots.forEach((slot, idx) => {
        const el = slotElements[idx]
        if (!el || slot.type !== "added") return

        // Scale in
        timeline.to(
          el,
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: "back.out(1.5)"
          },
          0.9 // After removed items are gone
        )

        // Pulse effect
        timeline.to(
          el,
          {
            scale: 1.1,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
            onStart: () => {
              playSound({ category: "ratfunUI", id: "itemPositive", volume: 0.3 })
            }
          },
          1.3 // After scale in
        )
      })

      // Step 5: Fade in empty slots
      inventorySlots.forEach((slot, idx) => {
        const el = slotElements[idx]
        if (!el || slot.type !== "empty") return

        timeline.to(
          el,
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          },
          0.8
        )
      })
    } else {
      // ENTRY ANIMATION: Normal staggered fade in
      timeline.to(
        validElements,
        {
          opacity: 1,
          scale: 1,
          duration: 0.2,
          stagger: 0.05,
          ease: "power2.out"
        },
        0.2
      )
    }
  }

  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline)
    }
  }

  const run = () => {
    prepare()
    main()
    done()
  }

  $effect(() => {
    // Wait for all slot elements to be available
    if (inventoryContainer && slotElements.length === inventorySlots.length) {
      run()
    }
  })
</script>

<div class="inventory">
  <InventoryHeader {filledSlots} totalSlots={MAX_INVENTORY_SIZE} {nftCount} {onImportClick} />
  {#if displayRat}
    <div class="inventory-container" bind:this={inventoryContainer}>
      <!-- INVENTORY GRID -->
      {#each inventorySlots as slot, index (index)}
        <div bind:this={slotElements[index]} class="slot-wrapper index-{slot.originalIndex}">
          <!-- Always render the container slot -->
          <div class="slot-container">
            <EmptySlot index={slot.originalIndex} />
          </div>
          <!-- Render item on top if present -->
          {#if slot.item}
            <div class="slot-item">
              <InteractiveItem
                item={slot.item}
                index={slot.originalIndex}
                itemId={slot.item.id}
                onExport={enableExport ? handleExportItem : undefined}
              />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .inventory {
    width: 100%;
    border-right: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-right: var(--dashed-border-style);
    overflow-x: hidden;
    overflow-y: scroll;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
    height: 100%;
  }

  .inventory-container {
    display: grid;
    gap: 6px;
    padding: 6px;
    box-sizing: border-box;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .slot-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .slot-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .slot-item {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
  }

  .slot-wrapper.index-0,
  .slot-wrapper.index-3 {
    grid-column: 1/2;
  }

  .slot-wrapper.index-1,
  .slot-wrapper.index-4 {
    grid-column: 2/3;
  }

  .slot-wrapper.index-2,
  .slot-wrapper.index-5 {
    grid-column: 3/4;
  }

  .slot-wrapper.index-0,
  .slot-wrapper.index-1,
  .slot-wrapper.index-2 {
    grid-row: 1/2;
  }

  .slot-wrapper.index-3,
  .slot-wrapper.index-4,
  .slot-wrapper.index-5 {
    grid-row: 2/3;
  }
</style>
