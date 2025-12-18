<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { rat } from "$lib/modules/state/stores"
  import { frozenRat, resetFrozenState } from "$lib/components/GameRun/state.svelte"
  import { RatStats, RatInventory, LiquidateRat } from "$lib/components/Rat"
  import { gsap } from "gsap"

  // Always use current rat state for displayRat
  // GSAP will handle visual transitions from old to new
  let displayRat = $state<Rat | null>($rat)

  // Calculate old and new values for animations
  // Initialize immediately - will be updated in onMount if frozenRat exists
  let oldRat = $state<Rat | null>(frozenRat ?? $rat)
  let newRat = $state<Rat | null>($rat)

  // ** Root Timeline Management **
  const rootTimeline = gsap.timeline()
  let statsTimeline: ReturnType<typeof gsap.timeline> | null = null
  let inventoryTimeline: ReturnType<typeof gsap.timeline> | null = null
  let liquidateTimeline: ReturnType<typeof gsap.timeline> | null = null
  let receivedTimelines = 0
  const expectedTimelines = 3 // RatStats, RatInventory, LiquidateRat

  // Handle RatStats timeline
  const addStatsTimeline = (timeline: ReturnType<typeof gsap.timeline>) => {
    statsTimeline = timeline
    receivedTimelines++
    checkAndBuildTimeline()
  }

  // Handle RatInventory timeline
  const addInventoryTimeline = (timeline: ReturnType<typeof gsap.timeline>) => {
    inventoryTimeline = timeline
    receivedTimelines++
    checkAndBuildTimeline()
  }

  // Handle LiquidateRat timeline
  const addLiquidateTimeline = (timeline: ReturnType<typeof gsap.timeline>) => {
    liquidateTimeline = timeline
    receivedTimelines++
    checkAndBuildTimeline()
  }

  // Build the root timeline when all child timelines are ready
  const checkAndBuildTimeline = () => {
    if (receivedTimelines === expectedTimelines) {
      const hasChanges = frozenRat !== null

      if (hasChanges) {
        // CHANGE ANIMATION: Sequential timing
        // Health finishes → Inventory starts → Total value starts
        if (statsTimeline) {
          rootTimeline.add(statsTimeline, 0)
        }
        if (inventoryTimeline) {
          rootTimeline.add(inventoryTimeline, ">") // After stats completes
        }
        if (liquidateTimeline) {
          rootTimeline.add(liquidateTimeline, ">") // After inventory completes
        }
      } else {
        // ENTRY ANIMATION: Parallel timing (all at once)
        if (statsTimeline) {
          rootTimeline.add(statsTimeline, 0)
        }
        if (inventoryTimeline) {
          rootTimeline.add(inventoryTimeline, 0)
        }
        if (liquidateTimeline) {
          rootTimeline.add(liquidateTimeline, 0)
        }
      }

      // Play the root timeline
      rootTimeline.play()

      // Reset frozenRat after animations complete
      rootTimeline.eventCallback("onComplete", () => {
        if (frozenRat) {
          resetFrozenState()
        }
      })
    }
  }

  onMount(() => {
    // Set displayRat to final state immediately
    displayRat = $rat

    // Determine old and new states for animations
    if (frozenRat) {
      // Coming back from trip - animate changes
      oldRat = frozenRat
      newRat = $rat
    } else {
      // Normal mount - just entry animation (old = new)
      oldRat = $rat
      newRat = $rat
    }
  })

  onDestroy(() => {
    if (rootTimeline) {
      rootTimeline.kill()
    }
  })
</script>

<div class="rat-info">
  <!-- Stats -->
  <div class="rat-stats-container" data-tutorial="rat-panel">
    <RatStats {displayRat} {oldRat} {newRat} onTimeline={addStatsTimeline} />
  </div>
  <!-- Inventory -->
  <div class="rat-inventory-container" data-tutorial="inventory">
    <RatInventory {displayRat} {oldRat} {newRat} onTimeline={addInventoryTimeline} />
  </div>
  <!-- Liquidate -->
  <div class="rat-liquidate-container" data-tutorial="cash-out">
    <LiquidateRat {displayRat} {oldRat} {newRat} onTimeline={addLiquidateTimeline} />
  </div>
</div>

<style lang="scss">
  .rat-info {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100%;
    width: 100%;
    user-select: none;

    .rat-stats-container {
      display: flex;
      flex-direction: row;
      border-bottom: var(--default-border-style);
      overflow: visible;
      height: 240px;

      @media (max-width: 800px) {
        height: 160px;
        order: 1;
      }
    }

    .rat-inventory-container {
      width: 100%;
      border-bottom: var(--default-border-style);
      flex: 1; /* Take remaining space */
      overflow: hidden;

      @media (max-width: 800px) {
        order: 3;
      }
    }

    .rat-liquidate-container {
      height: 140px;
      width: 100%;
      border-bottom: var(--default-border-style);
      flex-shrink: 0;
      overflow: visible; // Allow total value to overflow during scale animation

      @media (max-width: 800px) {
        order: 3;
      }
    }
  }
</style>
