<script lang="ts">
  import { focusEvent } from "$lib/modules/ui/state.svelte"
  import type { TripEvent } from "$lib/components/Admin/types"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings"

  import AdminEventLogItem from "./AdminEventLogItem.svelte"

  let y = $state(0)

  let {
    graphData,
    hideUnlockEvent = false,
    behavior = "hover"
  }: {
    graphData: TripEvent[]
    hideUnlockEvent?: boolean
    behavior?: "hover" | "click"
  } = $props()
  let scrollContainer = $state<HTMLElement>()
  let isScrolling = $state(false)
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null

  $effect(() => {
    if ($focusEvent !== -1) {
      const element = scrollContainer?.querySelector(".focus")

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
    }
  })
</script>

<div
  bind:this={scrollContainer}
  class="admin-event-log"
  onscroll={e => {
    y = e.currentTarget.scrollTop - e.currentTarget.clientHeight
  }}
>
  {#each graphData as point, index (point.index)}
    <AdminEventLogItem {point} {behavior} {isScrolling} />
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
