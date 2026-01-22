<script lang="ts">
  import type { Hex } from "viem"
  import { onDestroy } from "svelte"
  import { get } from "svelte/store"
  import { fade } from "svelte/transition"
  import { beforeNavigate, afterNavigate } from "$app/navigation"
  import {
    trips as allTripsStore,
    nonDepletedTrips,
    ratTotalValue,
    playerHasLiveRat,
    lastChallengeWinner,
    players
  } from "$lib/modules/state/stores"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { getTripMinRatValueToEnter } from "$lib/modules/state/utils"
  import { entriesChronologically } from "./sortFunctions"
  import { blockNumber } from "$lib/modules/network"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { staticContent } from "$lib/modules/content"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { FEATURES } from "$lib/config/features"

  import { TripItem, NoRatListing } from "$lib/components/Trip"
  import ChallengeCard from "$lib/components/Trip/TripFolders/ChallengeCard.svelte"
  import { SmallSpinner } from "$lib/components/Shared"
  import TripHeader from "./TripHeader.svelte"
  import { createLogger } from "$lib/modules/logger"

  const logger = createLogger("[TripListing]")

  // Show NoRatListing when player has no rat OR when rat is being deployed
  let showNoRatListing = $derived(
    !$playerHasLiveRat || ratState.state.current === RAT_BOX_STATE.DEPLOYING_RAT
  )

  let sortFunction = $state(entriesChronologically)
  let textFilter = $state("")
  let showDepleted = $state(false)
  let lastChecked = $state<number>(Number(get(blockNumber)))
  let scrollContainer = $state<HTMLDivElement | null>(null)

  // Filter handlers
  const handleSort = (fn: (a: [string, any], b: [string, any]) => number) => {
    sortFunction = fn
  }

  const handleTextFilterChange = (value: string) => {
    textFilter = value
  }

  const handleTextFilterClear = () => {
    textFilter = ""
  }

  const handleToggleDepleted = () => {
    showDepleted = !showDepleted
  }

  // Last completed challenge winner state
  const BLOCK_TIME_MS = 2000

  let lastWinnerName = $derived($lastChallengeWinner?.winnerName ?? null)

  let lastWinTimestamp = $derived.by(() => {
    const winner = $lastChallengeWinner
    if (!winner || !winner.lastVisitBlock) return null

    const currentBlock = Number($blockNumber)
    if (!currentBlock) return null

    const blocksSinceWin = currentBlock - winner.lastVisitBlock
    const msSinceWin = blocksSinceWin * BLOCK_TIME_MS

    return Date.now() - msSinceWin
  })

  // Find any active challenge trip
  let challengeTripData = $derived.by(() => {
    const allTrips = Object.entries($nonDepletedTrips)
    const challengeTrip = allTrips.find(([_, trip]) => trip.challengeTrip)
    if (!challengeTrip) return null

    const creatorId = challengeTrip[1].creatorId as string | undefined
    const creator = creatorId ? $players[creatorId] : undefined

    return {
      tripId: challengeTrip[0],
      visitCount: Number(challengeTrip[1].visitCount ?? 0),
      creationBlock: Number(challengeTrip[1].creationBlock ?? 0),
      creatorName: creator?.name ?? null,
      maxReward: Number(challengeTrip[1].balance ?? 0)
    }
  })

  const updateTrips = () => {
    lastChecked = Number(get(blockNumber))
  }

  // Get trips based on depleted filter
  // Exclude challenge trips from the main list since they're shown separately
  let tripList = $derived.by(() => {
    let entries: [string, Trip][]

    if (showDepleted) {
      // Show only depleted trips (in allTripsStore but not in nonDepletedTrips)
      const nonDepletedIds = new Set(Object.keys($nonDepletedTrips))
      entries = Object.entries($allTripsStore).filter(
        ([tripId, _]) => !nonDepletedIds.has(tripId)
      ) as [string, Trip][]
    } else {
      entries = Object.entries($nonDepletedTrips)
    }

    // Filter out challenge trips - they're shown in the pinned ChallengeCard
    entries = entries.filter(([_, trip]) => !trip.challengeTrip)

    // Apply text filter (search by prompt, creator name, or trip ID)
    if (textFilter.trim()) {
      const filter = textFilter.toLowerCase().trim()
      entries = entries.filter(([tripId, trip]) => {
        const prompt = (trip.prompt as string | undefined)?.toLowerCase() ?? ""
        const creatorId = trip.owner as string | undefined
        const creator = creatorId ? $players[creatorId] : undefined
        const creatorName = creator?.name?.toLowerCase() ?? ""
        const tripIdLower = tripId.toLowerCase()
        return (
          prompt.includes(filter) || creatorName.includes(filter) || tripIdLower.includes(filter)
        )
      })
    }

    logger.log("Deriving tripList:", { count: entries.length })
    return entries.sort(sortFunction)
  })

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

      return [tripId, trip, true, "", 0]
    })
  })

  let eligibleCount = $derived(tripsWithEligibility.filter(t => t[2]).length)

  // Scroll position preservation
  const SCROLL_KEY = "trip-listing-scroll-position"

  beforeNavigate(navigation => {
    if (scrollContainer && navigation.to?.route.id !== "/(main)/(game)") {
      sessionStorage.setItem(SCROLL_KEY, scrollContainer.scrollTop.toString())
    }
  })

  afterNavigate(navigation => {
    if (scrollContainer && navigation.from?.route.id?.includes("[tripId]")) {
      const savedPosition = sessionStorage.getItem(SCROLL_KEY)
      if (savedPosition) {
        scrollContainer.scrollTop = parseInt(savedPosition, 10)
      }
    }
  })

  onDestroy(() => {
    logger.log("onDestroy called")
  })
</script>

<div class="content" data-tutorial="trip-list">
  {#if showNoRatListing}
    <TripHeader hasBackButton />
    <NoRatListing />
  {:else}
    <!-- Challenge Card - Pinned at top, not scrollable -->
    {#if FEATURES.ENABLE_CHALLENGE_TRIPS}
      <div class="challenge-section">
        <ChallengeCard
          challengeTripId={challengeTripData?.tripId}
          attemptCount={challengeTripData?.visitCount}
          challengeCreationBlock={challengeTripData?.creationBlock}
          currentBlockNumber={Number($blockNumber)}
          challengeTitle={$staticContent.challengeTitle}
          {lastWinnerName}
          {lastWinTimestamp}
          creatorName={challengeTripData?.creatorName}
          maxReward={challengeTripData?.maxReward}
        />
      </div>
    {/if}

    <!-- Trip Header -->
    <TripHeader
      hasBackButton
      totalCount={tripsWithEligibility.length}
      {sortFunction}
      {textFilter}
      {showDepleted}
      onSort={handleSort}
      onTextFilterChange={handleTextFilterChange}
      onTextFilterClear={handleTextFilterClear}
      onToggleDepleted={handleToggleDepleted}
    />

    <!-- Scrollable Trip List -->
    <div class="trip-list-container" bind:this={scrollContainer}>
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
        <div class="trip-listing" in:fade={{ duration: 300 }}>
          {#each tripsWithEligibility as tripEntry (tripEntry[0])}
            <TripItem
              tripId={tripEntry[0] as Hex}
              trip={tripEntry[1]}
              disabled={!tripEntry[2]}
              overlayText={tripEntry[3]}
            />
          {/each}
        </div>
      {:else if Object.keys($nonDepletedTrips).length === 0}
        <div class="loading-container">
          <span>Loading trips <SmallSpinner /></span>
        </div>
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
    display: flex;
    flex-direction: column;
    height: var(--game-window-height);
    max-height: 100%;

    @media (max-width: 800px) {
      flex: 1;
      height: auto;
    }
  }

  .challenge-section {
    flex-shrink: 0;
    padding: 15px;
    border-bottom: var(--default-border-style);
    background: var(--background-semi-transparent);
  }

  .trip-list-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    overscroll-behavior-y: contain;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
  }

  .new-trips-button {
    width: 100%;
    background-color: var(--color-good);
    color: var(--background);
    height: 3rem;
    border: none;
    outline: none;
  }

  .trip-listing {
    width: 100%;
  }

  .empty-listing {
    height: 200px;
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
    height: 200px;
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
