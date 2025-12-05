<script lang="ts">
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"
  import { makeHref } from "$lib/components/Admin/helpers"
  import { focusEvent, selectedEvent } from "$lib/modules/ui/state.svelte"
  import type { TripEvent } from "$lib/components/Admin/types"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { goto } from "$app/navigation"

  import { tick } from "svelte"

  import AdminEventLogItem from "./AdminEventLogItem.svelte"

  let {
    graphData,
    hideUnlockEvent = false,
    focusEventOverride = undefined,
    selectedEventOverride = undefined,
    onFocusChange = undefined,
    onSelectionChange = undefined,
    onToggleToGraph = undefined,
    keyboardNavigating = false
  }: {
    graphData: TripEvent[]
    hideUnlockEvent?: boolean
    focusEventOverride?: number
    selectedEventOverride?: number
    onFocusChange?: (index: number, tripId: string) => void
    onSelectionChange?: (index: number, tripId: string) => void
    onToggleToGraph?: () => void
    keyboardNavigating?: boolean
  } = $props()

  let scrollContainer = $state<HTMLElement>()

  // Use overrides if provided, otherwise fall back to global state
  let effectiveFocusEvent = $derived(
    focusEventOverride !== undefined ? focusEventOverride : $focusEvent
  )
  let effectiveSelectedEvent = $derived(
    selectedEventOverride !== undefined ? selectedEventOverride : $selectedEvent
  )

  // Auto-scroll to selected event
  $effect(() => {
    if (effectiveSelectedEvent !== -1 && scrollContainer) {
      tick().then(() => {
        const selectedElement = scrollContainer?.querySelector(".selected")
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" })
        }
      })
    }
  })
</script>

<div class="admin-event-log-container">
  {#if onToggleToGraph}
    <div class="legend">
      <button onclick={onToggleToGraph} class="toggle-button active tablet-toggle"
        >{UI_STRINGS.graph.toUpperCase()}
      </button>
    </div>
  {/if}
  <div bind:this={scrollContainer} class="admin-event-log">
    {#each graphData.filter(p => p.eventType !== TRIP_EVENT_TYPE.BASELINE) as point, index (point.index)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class:selected={effectiveSelectedEvent === point.index}
        class:focus={effectiveFocusEvent === point.index}
        onclick={() => {
          if (onSelectionChange) {
            onSelectionChange(point.index, point.tripId)
          } else {
            $selectedEvent = point.index
          }
        }}
        onpointerenter={() => {
          // Skip pointer updates during keyboard navigation to prevent fighting
          if (keyboardNavigating) return

          if (onFocusChange) {
            onFocusChange(point.index, point.tripId)
          } else {
            $focusEvent = point.index
          }
        }}
        onpointerup={() => {
          if (
            point.eventType === TRIP_EVENT_TYPE.DEPLETED ||
            point.eventType === TRIP_EVENT_TYPE.CREATION ||
            point.eventType === TRIP_EVENT_TYPE.LIQUIDATION
          ) {
            const href = makeHref(point)
            if (href) {
              goto(href)
            }
          }
        }}
        class="log-item"
        class:secondary={point.eventType === TRIP_EVENT_TYPE.DEPLETED ||
          point.eventType === TRIP_EVENT_TYPE.CREATION ||
          point.eventType === TRIP_EVENT_TYPE.LIQUIDATION}
      >
        <AdminEventLogItem
          selected={effectiveSelectedEvent === point.index}
          focus={effectiveFocusEvent === point.index}
          {point}
        />
      </div>
    {/each}
    {#if !hideUnlockEvent}
      <div class="log-item secondary">{UI_STRINGS.adminUnlockedMessage}</div>
    {/if}
  </div>
</div>

<style lang="scss">
  .admin-event-log-container {
    position: relative;
    height: 100%;
    width: 100%;

    .legend {
      position: absolute;
      bottom: 0;
      right: 0;
      z-index: var(--z-top);
      padding: 8px;

      .toggle-button {
        border: none;

        &.active {
          background: black;
          color: white;
        }

        &:not(.active) {
          background: var(--color-grey-light);
          color: var(--color-grey-dark);
        }

        &.tablet-toggle {
          @media (min-width: 1025px) {
            display: none;
          }
        }
      }
    }
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

    .log-item {
      width: 100%;
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-small);

      &.secondary {
        color: var(--color-alert-priority);
      }

      &.focus {
        background: black;
      }

      &.selected {
        background: white;
        color: black;
      }
    }
  }
</style>
