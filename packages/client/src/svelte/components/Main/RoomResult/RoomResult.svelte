<script lang="ts">
  import { onDestroy } from "svelte"
  import type { ServerReturnValue } from "@components/Main/RoomResult/types"
  import { fadeAndScale } from "@modules/ui/transitions"
  import { fade } from "svelte/transition"
  import { player, rooms as roomsState } from "@modules/state/base/stores"
  import { enterRoom } from "@components/Main/RoomResult"
  import { ENVIRONMENT } from "@mud/enums"
  import { walletNetwork } from "@modules/network"

  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"
  import Log from "@components/Main/RoomResult/Log/Log.svelte"
  import Outcome from "@components/Main/RoomResult/Outcome.svelte"

  import { getUIState } from "@modules/ui/state.svelte"
  import { playSound } from "@svelte/modules/sound"
  const { rooms } = getUIState()

  let {
    start,
    animationstart,
    environment,
    roomId,
  }: {
    start: boolean
    animationstart: boolean
    environment: ENVIRONMENT
    roomId: string | null
  } = $props()

  let timeout: ReturnType<typeof setTimeout> | null = null
  let animationstarted = $state(false)
  let room = $roomsState[roomId ?? ""]
  let busy = $state(false)
  let error = $state("")

  let entering = $state(true)
  let outcome: ServerReturnValue | undefined = $state(undefined)
  let oldRoomBalance = room.balance

  $effect(() => {
    if (animationstart) animationstarted = true
  })

  const processRoom = async () => {
    console.time("Process")
    if (!roomId) return
    try {
      console.log("start result")
      const result = enterRoom(
        environment,
        $walletNetwork,
        roomId,
        $player.ownedRat
      )

      // Human reading speed is around 20-25 characters per second
      // const waitLength = Math.max(3000, room.roomPrompt.length * (1000 / 20))
      const waitLength = 3000
      await new Promise(resolve => setTimeout(resolve, waitLength))

      entering = false

      try {
        console.log("start outcome ")
        outcome = await result // add here just in case the entering transition would be faster
      } catch (err) {
        console.log("catch outcome ")
        throw err
      }
    } catch (error) {
      console.log("catch result")
      console.error(error)
      entering = false

      rooms.close()
    }
  }

  $effect(() => {
    if (start && !busy) {
      busy = true
      console.log("start")
      processRoom()
    }
  })

  onDestroy(() => {
    console.log("on destroy")
  })

  const sendLeaveRoom = () => {
    playSound("tcm", "enteredPod")
    rooms.close()
  }
</script>

<div class="room-result">
  {#if entering && animationstarted}
    <div class="room-meta" in:fadeAndScale out:fade>
      <div class="inner">
        <div class="name">
          {room.name}
        </div>
        <div class="title">
          <span>
            {room.roomPrompt}
          </span>
        </div>
      </div>
    </div>
  {:else}
    <!-- DESCRIPTION -->
    <div class="description">
      {room.roomPrompt}
    </div>

    {#if outcome && (outcome.log?.length ?? 0 > 0)}
      <!-- LOG -->
      <Log result={outcome} />
      <!-- OUTCOME -->
      <!-- <Outcome {room} {outcome} {oldRoomBalance} /> -->
      <div class="return">
        <button onclick={rooms.close}>LEAVE ROOM</button>
      </div>
    {:else if animationstarted}
      EXPERIMENT IN PROGRESS: <Spinner />
    {/if}
    {#if error}
      <div class="error">
        {error}
      </div>
      <div class="return">
        <button onclick={sendLeaveRoom}>LEAVE ROOM</button>
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  .room-result {
    height: 100%;
    color: var(--white);
    z-index: 10000;
    padding: 20px;
    font-size: var(--font-size-normal);
    overflow-y: auto;

    .description {
      margin-bottom: 20px;
      background: var(--color-alert);
      color: var(--black);
      max-width: 800px;
      padding: 10px;
    }
  }

  .room-meta {
    padding: 0;
    position: absolute;
    inset: 0;
    text-align: center;
    display: flex;
    height: 100dvh;
    justify-content: center;
    align-items: center;
    background: var(--color-alert);
    color: black;

    .inner {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      gap: 1rem;

      .name {
        background: white;
        color: black;
        width: auto;
        display: inline-block;
      }

      .title {
        font-size: 5rem;
      }
    }
  }

  button {
    padding: 10px;
    background: var(--color-alert);
    margin-top: 20px;
    cursor: pointer;
  }
</style>
