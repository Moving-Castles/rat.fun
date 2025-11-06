<script lang="ts">
  import type { Hex } from "viem"
  import { get } from "svelte/store"
  import { fade } from "svelte/transition"
  import { beforeNavigate, afterNavigate } from "$app/navigation"
  import { trips, ratTotalValue, playerHasLiveRat } from "$lib/modules/state/stores"
  import { getTripMinRatValueToEnter } from "$lib/modules/state/utils"
  import { entriesChronologically } from "./sortFunctions"
  import { filterTrips, filterDepletedTrips } from "./filterFunctions"
  import { blockNumber } from "$lib/modules/network"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { TripItem, TripHeader } from "$lib/components/Trip"
  import { staticContent } from "$lib/modules/content"

  let sortFunction = $state(entriesChronologically)
  let showDepletedTrips = false
  let textFilter = $state("")
  let lastChecked = $state<number>(Number(get(blockNumber)))
  let scrollContainer: HTMLDivElement | null = $state(null)
  let selectedFolderId: string = $state("")

  // Build trip folder map from staticContent
  let tripFolderMap = $derived(
    new Map(
      $staticContent.trips
        .filter(trip => trip.folder)
        .map(trip => [trip._id, trip.folder?._ref || ""])
    )
  )

  // Set default to first folder when folders are loaded
  $effect(() => {
    if ($staticContent.tripFolders.length > 0 && !selectedFolderId) {
      selectedFolderId = $staticContent.tripFolders[0]._id
    }
  })

  const updateTrips = () => {
    lastChecked = Number(get(blockNumber))
  }

  // Filter trips by folder
  const filterTripsByFolder = (entries: [string, Trip][], folderId: string) => {
    if (!folderId) return entries
    return entries.filter(([tripId, _]) => {
      const tripFolderId = tripFolderMap.get(tripId)
      return tripFolderId === folderId
    })
  }

  // Here we add once there are a couple of updates
  let tripList = $derived.by(() => {
    let entries = Object.entries($trips)
    entries = filterDepletedTrips(entries, showDepletedTrips)
    entries = filterTrips(entries, textFilter)
    entries = filterTripsByFolder(entries, selectedFolderId)
    return entries.sort(sortFunction)
  })

  let activeList = $derived.by(() => {
    // activeList
    if (lastChecked > 0) {
      return tripList.filter(r => Number(r[1].creationBlock) <= lastChecked)
    } else {
      return tripList
    }
  })

  // Calculate eligibility for each trip
  type TripWithEligibility = [string, Trip, boolean, string, number]

  let tripsWithEligibility = $derived.by((): TripWithEligibility[] => {
    return activeList.map(([tripId, trip]) => {
      // Check if rat value is high enough
      const minRatValue = get(getTripMinRatValueToEnter(trip.tripCreationCost))
      if ($ratTotalValue < minRatValue || !$playerHasLiveRat) {
        return [
          tripId,
          trip,
          false,
          `Rat value of ${CURRENCY_SYMBOL}${minRatValue} required`,
          minRatValue
        ]
      }

      // Trip is eligible
      return [tripId, trip, true, "", 0]
    })
  })

  // Keep trips in the same sort order (eligible and ineligible interleaved)
  let sortedTrips = $derived(tripsWithEligibility)

  // Count eligible trips
  let eligibleCount = $derived(tripsWithEligibility.filter(t => t[2]).length)

  // Scroll position preservation
  const SCROLL_KEY = "trip-listing-scroll-position"

  beforeNavigate(navigation => {
    // Save scroll position before navigating away
    if (scrollContainer && navigation.to?.route.id !== "/(main)/(game)") {
      sessionStorage.setItem(SCROLL_KEY, scrollContainer.scrollTop.toString())
    }
  })

  afterNavigate(navigation => {
    // Restore scroll position when coming back
    if (scrollContainer && navigation.from?.route.id?.includes("[tripId]")) {
      const savedPosition = sessionStorage.getItem(SCROLL_KEY)
      if (savedPosition) {
        scrollContainer.scrollTop = parseInt(savedPosition, 10)
      }
    }
  })
</script>

<div class="content" bind:this={scrollContainer}>
  <TripHeader
    hasRat={$playerHasLiveRat}
    {eligibleCount}
    totalCount={tripList.length}
    tripFolders={$staticContent.tripFolders}
    bind:selectedFolderId
  />
  <div class:animated={false} class="trip-listing" in:fade|global={{ duration: 300 }}>
    {#if activeList.length > 0}
      {#if activeList.length < tripList.length}
        {#key tripList.length}
          <button
            onclick={() => {
              sortFunction = entriesChronologically
              updateTrips()
            }}
            class="new-trips-button flash-fast-thrice"
          >
            {tripList.length - activeList.length} new trips added
          </button>
        {/key}
      {/if}
      {#each sortedTrips as tripEntry (tripEntry[0])}
        <TripItem
          tripId={tripEntry[0] as Hex}
          trip={tripEntry[1]}
          disabled={!tripEntry[2]}
          overlayText={tripEntry[3]}
        />
      {/each}
    {:else}
      <div class="empty-listing">
        <div>NO TRIPS</div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .content {
    position: relative;
    overflow-y: scroll;
    height: var(--game-window-main-height);
    height: var(--game-window-height);
    max-height: 100%;
  }

  .new-trips-button {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    background-color: var(--color-alert-priority);
    color: var(--black);
    height: 3rem;
    border: none;
    outline: none;
  }

  .new-player-message {
    width: 100%;
    height: calc(100% - 60px);
    background-color: rgba(0, 0, 0, 0.5);
    border: none;
    outline: none;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--foreground);
    font-family: var(--typewriter-font-stack);
    font-size: var(--font-size-normal);
    line-height: 1em;
    text-align: center;
  }

  .trip-listing {
    flex-basis: 100%;
    flex-shrink: 0;
    height: 100%;
    min-height: 100%;
    max-height: 100%;
    inset: 0;
    width: 100%;
    padding-top: 60px;

    &.animated {
      transition: transform 0.2s ease 0.1s;
    }
  }

  .empty-listing {
    height: calc(100% - 60px);
    display: flex;
    justify-content: center;
    align-items: center;

    div {
      background-color: var(--color-death);
      padding: 10px;
      color: var(--background);
    }
  }
</style>
