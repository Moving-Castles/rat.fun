<script lang="ts">
  import type { Snapshot } from "./$types"
  import { onMount } from "svelte"
  import { replaceState, goto } from "$app/navigation"
  import { page } from "$app/state"
  import { Trip } from "$lib/components/Room"
  import { sendEnterRoom } from "$lib/modules/action-manager/index.svelte"
  import { RoomError, APIError, NetworkError } from "$lib/modules/error-handling/errors"
  import { player, rooms as roomsState, rat } from "$lib/modules/state/stores"
  import { freezeObjects, TRIP_STATE } from "$lib/components/Room/Trip/state.svelte"
  import { stringifyWithBigInt, parseWithBigInt } from "$lib/modules/state/utils"
  import { createTripTransitions } from "$lib/modules/page-state/trip-transitions"

  // Incoming data
  let { data } = $props()

  let entryState = $state<App.PageState["entryState"]>({
    valid: false,
    processing: false,
    result: null,
    error: false,
    state: TRIP_STATE.SETUP,
    frozenRat: null,
    frozenRoom: null
  })

  let room = $derived($roomsState?.[data.roomId ?? ""])

  // Create state transition functions
  let { transitionTo, transitionToResultSummary } = $derived(createTripTransitions(entryState))

  // Capture a snapshot of the currently processing state
  export const snapshot: Snapshot = {
    capture: () => {
      const captureData = {
        valid: entryState.valid,
        processing: entryState.processing,
        timestamp: Date.now(),
        frozenRat: entryState.frozenRat,
        frozenRoom: entryState.frozenRoom
      }
      return JSON.parse(stringifyWithBigInt(captureData))
    },
    restore: value => {
      console.log("Restoring while entering")
      if (value?.valid && Date.now() - value.timestamp < 300000) {
        const parsed = parseWithBigInt(stringifyWithBigInt(value))
        console.log(parsed)
        entryState.valid = true
        entryState.processing = parsed.processing || false
        entryState.frozenRat = parsed.frozenRat
        entryState.frozenRoom = parsed.frozenRoom
      }
    }
  }

  // Process the room
  const processRoomEntry = async () => {
    if (entryState.processing || !data.roomId) return
    entryState.processing = true

    try {
      const result = await sendEnterRoom(data.roomId, $player.currentRat)

      if (!result) {
        throw new RoomError("No result returned from trip entry", data.roomId)
      }

      // Determine what to do based on the result
      if (result) {
        // Already has an ID
        // entryState.state = TRIP_STATE.RESULTS
        entryState.result = result
        replaceState(`/${data.roomId}/result/${result.outcomeId}`, {
          entryState: JSON.parse(stringifyWithBigInt(entryState))
        })
      } else {
        entryState.state = TRIP_STATE.ERROR
        goto("/")
      }
    } catch (err) {
      entryState.state = TRIP_STATE.ERROR
      entryState.error = true
      entryState.errorMessage = err.message
      if (err instanceof Error) {
        if (err.message.includes("network") || err.message.includes("fetch")) {
          throw new NetworkError(
            "ROOM_ENTRY_NETWORK_ERROR",
            "Network error during room entry",
            err.message
          )
        } else if (err.message.includes("api") || err.message.includes("server")) {
          throw new APIError("Trip entry API error: " + err.message, err)
        } else {
          throw new RoomError("Trip entry failed: " + err.message, data.roomId)
        }
      }
    }
  }

  onMount(async () => {
    console.log("on mount, and we have data", data.roomId)
    const shouldEnter = page.url.searchParams.get("enter") === "true"
    const ratId = page.url.searchParams.get("rat")
    const timestamp = parseInt(page.url.searchParams.get("t") || "0")

    if (shouldEnter && ratId === $player.currentRat && Date.now() - timestamp < 30000) {
      console.log("We can start getting the result")
      entryState.valid = true
      replaceState(`/${data.roomId}/result`, {})
      const { frozenRat, frozenRoom } = freezeObjects(
        $rat,
        room,
        data.roomId as `0x${string}`,
        $player.currentRat
      )
      entryState.frozenRat = frozenRat
      entryState.frozenRoom = frozenRoom
      await processRoomEntry()
    } else if (!entryState.valid) {
      console.log("We mounted and we cannot enter")
      await goto("/")
    }
  })
</script>

<Trip roomId={data.roomId} {entryState} {transitionTo} {transitionToResultSummary} />
