<script lang="ts">
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import type { Hex } from "viem"
  import { onMount, onDestroy } from "svelte"
  import { pushState, goto } from "$app/navigation"
  import { player, rooms as roomsState, rat as ratState } from "$lib/modules/state/base/stores"
  import {
    ROOM_RESULT_STATE,
    SHOW_INFO_BOXES,
    SHOW_LOG,
    roomResultState,
    transitionTo,
    transitionToResultSummary,
    resetRoomResultState,
    freezeObjects
  } from "$lib/components/Room/RoomResult/state.svelte"
  import {
    SplashScreen,
    WaitingForResult,
    Log,
    RatInfoBox,
    RoomInfoBox,
    NormalResultSummary,
    RatDeadResultSummary,
    LevelUpResultSummary,
    LevelDownResultSummary
  } from "$lib/components/Room"
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
    if (!roomId) {
      return
    }

    try {
      const ret = sendEnterRoom(roomId, $player.ownedRat)

      try {
        result = await ret
        if (!result) {
          throw new Error("No result returned")
        }
        // Result returned, transition to showing results
        transitionTo(ROOM_RESULT_STATE.SHOWING_RESULTS)
        console.log("result", result)
        pushState(`/outcome/${result.outcomeId}`, {})
      } catch (err) {
        console.log("catch outcome error", err)
        throw err
      }
    } catch (error) {
      console.log("catch result error", error)
      transitionTo(ROOM_RESULT_STATE.ERROR)
      await goto("/game")
      return
    }
  }

  onMount(() => {
    if (!$ratState) goto("/game")
    freezeObjects($ratState, room, roomId as Hex, $player.ownedRat as Hex)
    resetRoomResultState()
    processRoom()
  })

  onDestroy(() => {
    resetRoomResultState()
  })
</script>

<div class="room-result">
  <!-- SPLASH SCREEN -->
  {#if roomResultState.state === ROOM_RESULT_STATE.SPLASH_SCREEN}
    <SplashScreen
      {staticRoomContent}
      onComplete={() => {
        transitionTo(ROOM_RESULT_STATE.WAITING_FOR_RESULT)
      }}
    />
  {/if}

  <!-- INFO BOXES -->
  {#if SHOW_INFO_BOXES.includes(roomResultState.state)}
    <div class="info-boxes">
      <RatInfoBox />
      <div class="divider"></div>
      <RoomInfoBox {staticRoomContent} />
    </div>
  {/if}

  <!-- WAITING FOR RESULT -->
  {#if roomResultState.state === ROOM_RESULT_STATE.WAITING_FOR_RESULT}
    <WaitingForResult />
  {/if}

  <!-- LOG -->
  {#if SHOW_LOG.includes(roomResultState.state)}
    <Log
      {result}
      onComplete={() => {
        setTimeout(() => {
          if (result) {
            transitionToResultSummary(result)
          }
        }, 1000)
      }}
    />
  {/if}

  <!-- Result Summary: Normal -->
  {#if roomResultState.state === ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL}
    <NormalResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Result Summary: Rat Dead -->
  {#if roomResultState.state === ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD}
    <RatDeadResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Result Summary: Level Up -->
  {#if roomResultState.state === ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_UP}
    <LevelUpResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Result Summary: Level Down -->
  {#if roomResultState.state === ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_DOWN}
    <LevelDownResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Error -->
  {#if roomResultState.state === ROOM_RESULT_STATE.ERROR}
    <div class="error">
      {roomResultState.errorMessage}
    </div>
  {/if}
</div>

<style lang="scss">
  .room-result {
    height: 100%;
    color: var(--white);
    z-index: var(--z-high);
    padding: 20px;
    padding-bottom: 0;
    font-size: var(--font-size-normal);
    overflow-y: auto;
    border: var(--default-border-style);
    top: 32px;
  }

  .info-boxes {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: var(--info-box-height);
  }

  .divider {
    width: 100px;
    height: 100%;
    background: repeating-linear-gradient(
      45deg,
      #000000,
      #000000 20px,
      var(--color-grey-dark) 20px,
      var(--color-grey-dark) 40px
    );
    border: var(--default-border-style);
  }
</style>
