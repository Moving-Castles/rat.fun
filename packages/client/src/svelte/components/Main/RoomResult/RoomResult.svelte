<script lang="ts">
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import type { Hex } from "viem"
  import {
    ROOM_RESULT_STATE,
    SHOW_INFO_BOXES,
    SHOW_LOG,
    roomResultState,
    transitionTo,
    transitionToResultSummary,
    resetRoomResultState,
  } from "@svelte/components/Main/RoomResult/roomResultState.svelte"

  import {
    player,
    rooms as roomsState,
    rat as ratState,
  } from "@modules/state/base/stores"
  import { onMount, onDestroy } from "svelte"
  import { enterRoom } from "@components/Main/RoomResult"
  import { ENVIRONMENT } from "@mud/enums"
  import { walletNetwork } from "@modules/network"
  import { getUIState } from "@modules/ui/state.svelte"
  import { staticContent } from "@modules/content"

  import SplashScreen from "@svelte/components/Main/RoomResult/SplashScreen/SplashScreen.svelte"
  import WaitingForResult from "@svelte/components/Main/RoomResult/WaitingForResult/WaitingForResult.svelte"
  import Log from "@components/Main/RoomResult/Log/Log.svelte"
  import RatInfoBox from "@components/Main/RoomResult/InfoBox/Rat/RatInfoBox.svelte"
  import RoomInfoBox from "@components/Main/RoomResult/InfoBox/Room/RoomInfoBox.svelte"
  import NormalResultSummary from "@components/Main/RoomResult/ResultSummary/NormalResultSummary.svelte"
  import RatDeadResultSummary from "@components/Main/RoomResult/ResultSummary/RatDeadResultSummary.svelte"
  import LevelUpResultSummary from "@components/Main/RoomResult/ResultSummary/LevelUpResultSummary.svelte"
  import LevelDownResultSummary from "@components/Main/RoomResult/ResultSummary/LevelDownResultSummary.svelte"

  const { rooms } = getUIState()

  let {
    environment,
    roomId,
  }: {
    environment: ENVIRONMENT
    roomId: string | null
  } = $props()

  // Result of the room entry, returned by the server
  let result: EnterRoomReturnValue | null = $state(null)

  // Get room info from global store based on id
  let room = $derived($roomsState?.[roomId ?? ""])

  // Get static room content from cms
  let staticRoomContent = $derived(
    $staticContent.rooms.find(r => r._id == (roomId ?? ""))
  )

  const processRoom = async () => {
    if (!roomId) return
    try {
      const ret = enterRoom(
        environment,
        $walletNetwork,
        roomId,
        $player.ownedRat
      )

      await new Promise(resolve => setTimeout(resolve, 5000))

      try {
        result = await ret
        transitionTo(ROOM_RESULT_STATE.SHOWING_RESULTS)
      } catch (err) {
        console.log("catch outcome error", err)
        throw err
      }
    } catch (error) {
      console.log("catch result error", error)
      transitionTo(ROOM_RESULT_STATE.ERROR)
      rooms.close()
      // rooms.close(
      //   resultEvent !== RESUEVEL_UP &&
      //     resultEvent !== RESULT_EVENT.LEVEL_DOWN
      // )
      return
    }
  }

  onMount(() => {
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
      rat={$ratState}
      {room}
      roomId={roomId as Hex}
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
        transitionToResultSummary(result)
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
    z-index: 10000;
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
