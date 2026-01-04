<script lang="ts">
  import type { Hex } from "viem"
  import { onDestroy } from "svelte"
  import { get } from "svelte/store"
  import { fade } from "svelte/transition"
  import { beforeNavigate, afterNavigate } from "$app/navigation"
  import {
    nonDepletedTrips,
    ratTotalValue,
    playerHasLiveRat,
    lastChallengeWinner
  } from "$lib/modules/state/stores"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { selectedFolderId } from "$lib/modules/ui/state.svelte"
  import { getTripMinRatValueToEnter } from "$lib/modules/state/utils"
  import { entriesChronologically } from "./sortFunctions"
  import { blockNumber } from "$lib/modules/network"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { staticContent } from "$lib/modules/content"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  import { TripItem, TripFolders, NoRatListing } from "$lib/components/Trip"
  import { BackButton, SmallSpinner } from "$lib/components/Shared"
  import TripHeader from "./TripHeader.svelte"
  import { createLogger } from "$lib/modules/logger"

  const logger = createLogger("[TripListing]")

  // Show NoRatListing when player has no rat OR when rat is being deployed
  // The DEPLOYING_RAT check ensures we don't hide the no-rat UI until deployment is truly finished
  let showNoRatListing = $derived(
    !$playerHasLiveRat || ratState.state.current === RAT_BOX_STATE.DEPLOYING_RAT
  )

  let sortFunction = $state(entriesChronologically)
  let lastChecked = $state<number>(Number(get(blockNumber)))
  let scrollContainer = $state<HTMLDivElement | null>(null)

  // Last completed challenge winner state
  // Calculate win timestamp from block difference (Base block time ~2 seconds)
  const BLOCK_TIME_MS = 2000

  let lastWinnerName = $derived($lastChallengeWinner?.winnerName ?? null)

  // Calculate approximate win timestamp from block number difference
  let lastWinTimestamp = $derived.by(() => {
    const winner = $lastChallengeWinner
    if (!winner || !winner.lastVisitBlock) return null

    const currentBlock = Number($blockNumber)
    if (!currentBlock) return null

    // Calculate how long ago the win happened based on block difference
    const blocksSinceWin = currentBlock - winner.lastVisitBlock
    const msSinceWin = blocksSinceWin * BLOCK_TIME_MS

    // Return the approximate timestamp when the challenge was won
    return Date.now() - msSinceWin
  })

  // Build trip folder map from staticContent
  let tripFolderMap = $derived(
    new Map(
      $staticContent.trips
        .filter(trip => trip.folder)
        .map(trip => [trip._id, trip.folder?._ref || ""])
    )
  )

  // Separate restricted folders from regular folders
  // Only show the first restricted folder at the top
  let restrictedFolder = $derived.by(() => {
    const folders = $staticContent.tripFolders
    return folders.find(f => f.restricted)
  })

  // Regular folders (non-restricted)
  let regularFolders = $derived.by(() => {
    const folders = $staticContent.tripFolders
    return folders.filter(f => !f.restricted)
  })

  // Find any active challenge trip (has challengeTrip flag and balance > 0)
  let challengeTripData = $derived.by(() => {
    if (!restrictedFolder) return null

    // Find the first trip with challengeTrip flag from all non-depleted trips
    const allTrips = Object.entries($nonDepletedTrips)
    const challengeTrip = allTrips.find(([_, trip]) => trip.challengeTrip)
    if (!challengeTrip) return null

    return {
      tripId: challengeTrip[0],
      visitCount: Number(challengeTrip[1].visitCount ?? 0)
    }
  })

  // Show ALL folders in their original order (for backward compat, keep this for counts)
  let sortedFolders = $derived.by(() => {
    const folders = $staticContent.tripFolders
    logger.log("Deriving sortedFolders:", { count: folders?.length ?? 0 })
    return folders
  })

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

  // Here we add once there are a couple of updates
  // ???
  let tripList = $derived.by(() => {
    let entries = Object.entries($nonDepletedTrips)
    // DEBUG: Log trip counts to diagnose rendering issue
    logger.log("Deriving tripList:", {
      nonDepletedTripsCount: entries.length,
      selectedFolder: $selectedFolderId,
      staticContentTripsCount: $staticContent.trips.length,
      tripFolderMapSize: tripFolderMap.size
    })
    entries = filterByFolder(entries, $selectedFolderId)
    return entries.sort(sortFunction)
  })

  // Count trips per regular folder (not restricted)
  let foldersCounts = $derived(
    regularFolders.map(fldr => filterByFolder(tripList, fldr._id).length)
  )

  // Count trips in restricted folder (for when challenge trips feature is disabled)
  let restrictedFolderCount = $derived(
    restrictedFolder
      ? filterByFolder(Object.entries($nonDepletedTrips), restrictedFolder._id).length
      : 0
  )

  let activeList = $derived.by(() => {
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
      const minRatValue = get(
        getTripMinRatValueToEnter(
          trip.tripCreationCost,
          trip.challengeTrip,
          trip.fixedMinValueToEnter
        )
      )
      if ($ratTotalValue < minRatValue || !$playerHasLiveRat) {
        return [
          tripId,
          trip,
          false,
          `Rat value of ${minRatValue} ${CURRENCY_SYMBOL} required`,
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

  // Scroll to top when folder selection changes
  $effect(() => {
    $selectedFolderId // Track dependency
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }
  })

  onDestroy(() => {
    logger.log("onDestroy called")
  })
</script>

<div class="content" bind:this={scrollContainer} data-tutorial="trip-list">
  {#if showNoRatListing}
    <TripHeader title={UI_STRINGS.tripHeaderNoRat} />
    <NoRatListing />
  {:else if $selectedFolderId === ""}
    <TripHeader title={UI_STRINGS.tripHeader} />
    {#if (regularFolders?.length ?? 0) > 0 || restrictedFolder}
      <TripFolders
        onselect={(folderId: string) => ($selectedFolderId = folderId)}
        folders={regularFolders}
        {foldersCounts}
        {restrictedFolder}
        {restrictedFolderCount}
        challengeTripId={challengeTripData?.tripId}
        challengeTripAttempts={challengeTripData?.visitCount}
        dailyChallengeTime={$staticContent.dailyChallengeTime}
        nextChallengeDay={$staticContent.nextChallengeDay}
        challengeTitle={$staticContent.challengeTitle}
        {lastWinnerName}
        {lastWinTimestamp}
      />
    {:else}
      <div class="loading-container">
        <span>Loading trips <SmallSpinner /></span>
      </div>
    {/if}
  {:else}
    <div class="back-button-container">
      <BackButton onclick={() => ($selectedFolderId = "")} />
    </div>
    {#if $selectedFolderId !== ""}
      {@const folderTitle =
        $staticContent.tripFolders.find(({ _id }) => _id == $selectedFolderId)?.title ?? ""}
      <TripHeader
        title={folderTitle}
        {eligibleCount}
        totalCount={tripsWithEligibility.length}
        hasBackButton={true}
      />
    {/if}
    <div class:animated={false} class="trip-listing" in:fade={{ duration: 300 }}>
      {#if activeList.length > 0}
        {#if activeList.length < tripList.length}
          {#key tripList.length}
            <button
              onclick={() => {
                sortFunction = entriesChronologically
                updateTrips()
              }}
              class="new-trips-button"
            >
              {tripList.length - activeList.length} new trips added
            </button>
          {/key}
        {/if}
        {#each tripsWithEligibility as tripEntry (tripEntry[0])}
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
  {/if}
</div>

<style lang="scss">
  .content {
    position: relative;
    overflow-y: scroll;
    height: var(--game-window-main-height);
    height: var(--game-window-height);
    max-height: 100%;

    @media (max-width: 800px) {
      flex: 1;
      height: auto;
    }
  }

  .new-trips-button {
    width: 100%;
    background-color: var(--color-good);
    color: var(--background);
    height: 3rem;
    border: none;
    outline: none;
  }

  .back-button-container {
    display: block;
    border-bottom: 1px solid var(--color-grey-mid);
    position: sticky;
    height: 60px;
    top: 0;
    z-index: var(--z-high);
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--background);
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
      background-color: var(--color-bad);
      padding: 10px;
      color: var(--background);
    }
  }

  .loading-container {
    height: calc(100% - 60px);
    display: flex;
    justify-content: center;
    align-items: center;

    span {
      background-color: var(--background-semi-transparent);
      padding: 10px;
      color: var(--foreground);
    }
  }
</style>
