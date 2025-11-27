<script lang="ts">
  import { focusEvent, selectedEvent } from "$lib/modules/ui/state.svelte"
  import type { TripEvent } from "$lib/components/Admin/types"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings"

  import { tick } from "svelte"

  import AdminEventLogItem from "./AdminEventLogItem.svelte"

  let {
    graphData,
    hideUnlockEvent = false,
    behavior = "hover",
    focusEventOverride = undefined,
    selectedEventOverride = undefined,
    onFocusChange = undefined,
    onSelectionChange = undefined
  }: {
    graphData: TripEvent[]
    hideUnlockEvent?: boolean
    behavior?: "hover" | "click"
    focusEventOverride?: number
    selectedEventOverride?: number
    onFocusChange?: (index: number, tripId: string) => void
    onSelectionChange?: (index: number, tripId: string) => void
  } = $props()

  // Use override values if provided, otherwise use global stores
  let effectiveFocusEvent = $derived(
    focusEventOverride !== undefined ? focusEventOverride : $focusEvent
  )
  let effectiveSelectedEvent = $derived(
    selectedEventOverride !== undefined ? selectedEventOverride : $selectedEvent
  )
  let scrollContainer = $state<HTMLElement>()
  let isScrolling = $state(false)
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null

  $effect(() => {
    // React to focusEvent or selectedEvent changes and scroll to the element
    // Explicitly reference both to ensure reactivity
    const focus = effectiveFocusEvent
    const selected = effectiveSelectedEvent
    const shouldScroll = (focus !== -1 || selected !== -1) && graphData.length > 0

    if (shouldScroll) {
      // Use tick() to ensure Svelte has updated the DOM
      tick().then(() => {
        // Prioritize hovered (active navigation) over selected
        const element =
          scrollContainer?.querySelector(".hovered") || scrollContainer?.querySelector(".selected")

        if (element && scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect()
          const elementRect = element.getBoundingClientRect()

          // Only scroll if element is outside viewport
          const isVisible =
            elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom

          if (!isVisible) {
            // Set flag to prevent pointer events from interfering
            isScrolling = true

            // Clear any existing timeout
            if (scrollTimeout) clearTimeout(scrollTimeout)

            element.scrollIntoView({ block: "nearest" })

            // Clear flag after scroll animation completes
            scrollTimeout = setTimeout(() => {
              isScrolling = false
              scrollTimeout = null
            }, 150)
          }
        }
      })
    }
  })
</script>

<div bind:this={scrollContainer} class="admin-event-log">
  {#each graphData as point, index (point.index)}
    <AdminEventLogItem
      {point}
      {behavior}
      {isScrolling}
      {focusEventOverride}
      {selectedEventOverride}
      {onFocusChange}
      {onSelectionChange}
    />
  {/each}
  {#if !hideUnlockEvent}
    <p class="event">{UI_STRINGS.adminUnlockedMessage}</p>
  {/if}
</div>

<style lang="scss">
  .fixed-debug {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 999;
  }
  .admin-event-log {
    background: var(--color-grey-dark);
    height: 100%;
    max-height: 800px;
    overflow-y: scroll;
    flex-flow: column nowrap;
    align-items: start;
    justify-content: flex-start;
    gap: 8px;
    padding: 6px;
    user-select: none;

    .event {
      padding: 0;
      margin: 0;
      color: white;
      display: block;
      margin-bottom: 4px;
      font-size: var(--font-size-small);
    }
  }
</style>
