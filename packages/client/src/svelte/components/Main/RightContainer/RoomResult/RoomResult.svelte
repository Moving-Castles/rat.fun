<script lang="ts">
  import { onDestroy } from "svelte"
  import type { ServerReturnValue } from "@components/Main/RightContainer/RoomResult/types"
  import { fadeAndScale } from "@modules/ui/transitions"
  import { player, rooms as roomsState } from "@modules/state/base/stores"
  import { enterRoom } from "@svelte/components/Main/RightContainer/RoomResult"
  import { ENVIRONMENT } from "@mud/enums"
  import { walletNetwork } from "@modules/network"

  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"
  import Log from "@components/Main/RightContainer/RoomResult/Log/Log.svelte"
  import Outcome from "@components/Main/RightContainer/RoomResult/Outcome.svelte"

  import { getUIState } from "@svelte/modules/ui/state.svelte"

  const { rooms } = getUIState()

  let {
    start,
    animationstart,
    environment,
    roomId,
  }: { start: boolean; environment: ENVIRONMENT; roomId: string | null } =
    $props()

  let timeout: ReturnType<typeof setTimeout> | null = null
  let animationstarted = $state(false)
  let room = $roomsState[roomId ?? ""]
  let busy = $state(false)

  let entering = $state(true)
  let outcome: ServerReturnValue | undefined = $state(undefined)
  let oldRoomBalance = room.balance

  $effect(() => {
    if (animationstart) animationstarted = true
  })

  function close() {
    rooms.back()
  }

  const processRoom = async () => {
    if (!roomId) return
    const result = enterRoom(
      environment,
      $walletNetwork,
      roomId,
      $player.ownedRat
    )

    // Human reading speed is around 20-25 characters per second
    const waitLength = Math.max(3000, room.roomPrompt.length * (1000 / 20))

    timeout = setTimeout(async () => {
      entering = false
      outcome = await result // add here just in case the entering transition would be faster
    }, waitLength)
  }

  $effect(() => {
    if (start && !busy) {
      busy = true
      console.log("start")
      processRoom()
    }
  })

  onDestroy(() => {
    if (timeout) clearTimeout(timeout)
  })
</script>

<div class="room-result">
  {#if entering && animationstarted}
    <div in:fadeAndScale class="room-meta">
      <div class="inner">
        <span>
          {room.name}
        </span>
        <span class="title">
          {room.roomPrompt}
        </span>
      </div>
    </div>
  {:else}
    <!-- DESCRIPTION -->
    <div class="description">
      {room.roomPrompt}
    </div>

    {#if outcome && (outcome.log?.length ?? 0 > 0)}
      <!-- LOG -->
      <Log log={outcome.log} />

      <!-- OUTCOME -->
      <Outcome {room} {outcome} {oldRoomBalance} />
      <div class="return">
        <button onclick={close}>LEAVE ROOM</button>
      </div>
    {:else if animationstarted}
      EXPERIMENT IN PROGRESS: <Spinner />
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
