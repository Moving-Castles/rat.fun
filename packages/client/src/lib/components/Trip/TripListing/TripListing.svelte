<script lang="ts">
  import type { Hex } from "viem"
  import { get } from "svelte/store"
  import { fade } from "svelte/transition"
  import { beforeNavigate, afterNavigate } from "$app/navigation"
  import { nonDepletedTrips, ratTotalValue, playerHasLiveRat } from "$lib/modules/state/stores"
  import { getTripMinRatValueToEnter } from "$lib/modules/state/utils"
  import { entriesChronologically } from "./sortFunctions"
  import { blockNumber } from "$lib/modules/network"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { TripItem, TripFolders } from "$lib/components/Trip"
  import { staticContent } from "$lib/modules/content"
  import { BackButton, SmallSpinner } from "$lib/components/Shared"

  let sortFunction = $state(entriesChronologically)
  let textFilter = $state("")
  let lastChecked = $state<number>(Number(get(blockNumber)))
  let scrollContainer = $state<HTMLDivElement | null>(null)
  let selectedFolderId = $state("")

  // Build trip folder map from staticContent
  let tripFolderMap = $derived(
    new Map(
      $staticContent.trips
        .filter(trip => trip.folder)
        .map(trip => [trip._id, trip.folder?._ref || ""])
    )
  )

  const updateTrips = () => {
    lastChecked = Number(get(blockNumber))
  }

  // Filter trips by folder
  const filterByFolder = (entries: [string, Trip][], id: string) => {
    if (id === "") return entries
    return entries.filter(([tripId, _]) => {
      const tripFolderId = tripFolderMap.get(tripId)
      return tripFolderId === id
    })
  }

  // Filter trips without folder assignments (legacy trips)
  let legacyTrips = $derived.by(() => {
    return Object.entries($nonDepletedTrips).filter(([tripId, _]) => {
      return !tripFolderMap.has(tripId)
    })
  })

  // Here we add once there are a couple of updates
  let tripList = $derived.by(() => {
    let entries = Object.entries($nonDepletedTrips)
    entries = filterByFolder(entries, selectedFolderId)

    return entries.sort(sortFunction)
  })

  let foldersCounts = $derived(
    $staticContent.tripFolders.map(fldr => filterByFolder(tripList, fldr._id).length)
  )

  let activeList = $derived.by(() => {
    if (selectedFolderId !== "legacy") {
      if (lastChecked > 0) {
        return tripList.filter(r => Number(r[1].creationBlock) <= lastChecked)
      } else {
        return tripList
      }
    } else {
      return Object.entries($nonDepletedTrips)
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
  {#if selectedFolderId === ""}
    {#if $staticContent.trips.length > 0}
      <TripFolders
        {legacyTrips}
        onselect={(folderId: string) => (selectedFolderId = folderId)}
        folders={$staticContent.tripFolders}
        {foldersCounts}
      />
    {:else}
      <div class="loading">
        <SmallSpinner />
      </div>
    {/if}
  {:else}
    {#if selectedFolderId !== ""}
      {@const i = $staticContent.tripFolders.findIndex(({ _id }) => _id === selectedFolderId)}
      <div
        class:void={i === -1}
        style:background-image="url('/images/texture-{2 + (i % 5)}.png');"
        class="folder-name-container"
      >
        {#if selectedFolderId === "legacy"}
          <span> The Void </span>
        {:else}
          <span>
            {$staticContent.tripFolders.find(({ _id }) => _id == selectedFolderId).title}
          </span>
        {/if}
      </div>
    {/if}
    <div class="back-button-container">
      <BackButton onclick={() => (selectedFolderId = "")} />
    </div>
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
        {#if selectedFolderId === "legacy"}
          {#each legacyTrips as tripEntry (tripEntry[0])}
            <TripItem tripId={tripEntry[0] as Hex} trip={tripEntry[1]} />
          {/each}
        {:else}
          {#each tripsWithEligibility as tripEntry (tripEntry[0])}
            <TripItem
              tripId={tripEntry[0] as Hex}
              trip={tripEntry[1]}
              disabled={!tripEntry[2]}
              overlayText={tripEntry[3]}
            />
          {/each}
        {/if}
      {:else}
        <div class="empty-listing">
          <div>NO TRIPS</div>
        </div>
      {/if}
    </div>
  {/if}
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

  .folder-name-container,
  .back-button-container {
    display: block;
    border-bottom: 1px solid var(--color-grey-mid);
    position: sticky;
    height: 60px;
    top: 0;
    z-index: 20;
    display: flex;
    justify-content: center;
    align-items: center;
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

  .loading {
    width: 100%;
    height: 100%;
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
  }

  .void {
    background: rgb(40, 40, 40);
    color: white;
  }

  .trip-header {
    display: flex;
    width: 100%;
    height: 100px;
    gap: 1rem;

    .back-button {
      width: 100%;
      height: 100%;
      background: var(--color-alert-priority);
      border: none;
      border-style: outset;
      border-width: 5px;
      border-color: rgba(0, 0, 0, 0.3);
      position: relative;
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;

      .button-text {
        font-size: var(--font-size-large);
        font-family: var(--special-font-stack);
        line-height: 1em;
        z-index: 2;
        position: relative;
        color: rgb(54, 54, 54);
      }
    }
  }
  .trip-listing {
    flex-basis: 100%;
    flex-shrink: 0;
    height: 100%;
    min-height: 100%;
    max-height: 100%;
    inset: 0;
    width: 100%;

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
