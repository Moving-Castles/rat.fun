<script lang="ts">
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import type { Hex } from "viem"
  import { onMount, onDestroy } from "svelte"
  import { goto } from "$app/navigation"
  import { navigating } from "$app/state"
  import { player, rooms as roomsState, rat as ratState } from "$lib/modules/state/stores"
  import {
    ROOM_RESULT_STATE,
    transitionTo,
    resetRoomResultState,
    freezeObjects
  } from "$lib/components/Room/RoomResult/state.svelte"
  import { SplashScreen } from "$lib/components/Room"
  import { staticContent } from "$lib/modules/content"
  import { sendEnterRoom } from "$lib/modules/action-manager/index.svelte"

  let {
    roomId
  }: {
    roomId: string | null
  } = $props()

  // Result of the room entry, returned by the server
  let result: EnterRoomReturnValue | null = $state(null)

  // Get room info from global store based on id
  let room = $derived($roomsState?.[roomId ?? ""])

  // Get static room content from cms
  let staticRoomContent = $derived($staticContent.rooms.find(r => r._id == (roomId ?? "")))

  const processRoom = async () => {
    const ratId = new URL(window.location.href).searchParams.get("ratId")

    if (!roomId || !$player.currentRat || !ratId) {
      window.history.back()
    }

    try {
      const ret = sendEnterRoom(roomId, $player.currentRat)

      try {
        result = await ret
        if (!result) {
          throw new Error("No result returned")
        }
        // Result returned, transition to showing results
        goto(`/rooms/${roomId}/ret`)
      } catch (err) {
        console.log("catch outcome error", err)
        throw err
      }
    } catch (error) {
      console.log("catch result error", error)
      transitionTo(ROOM_RESULT_STATE.ERROR)
      await goto("/")
      return
    }
  }

  onMount(() => {
    if (!$ratState) {
      goto("/")
      return
    }

    // Temporary fix to prevent server call when navigating back to game page
    // Fundamental problem is why RoomResult is remounted after result summary
    if (navigating.to?.route.id === "/(rooms)/") {
      return
    }

    freezeObjects($ratState, room, roomId as Hex, $player.currentRat as Hex)
    resetRoomResultState()
    processRoom()
  })

  onDestroy(() => {
    resetRoomResultState()
  })
</script>

<div class="room-result">
  <!-- SPLASH SCREEN -->
  <SplashScreen
    {staticRoomContent}
    onComplete={() => {
      transitionTo(ROOM_RESULT_STATE.WAITING_FOR_RESULT)
    }}
  />
</div>

<style lang="scss">
  .room-result {
    height: 100%;
    color: var(--white);
    z-index: var(--z-high);
    font-size: var(--font-size-normal);
    overflow-y: auto;
    top: 32px;
  }
</style>
