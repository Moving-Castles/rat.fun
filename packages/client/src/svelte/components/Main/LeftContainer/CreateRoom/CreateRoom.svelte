<script lang="ts">
  import { player, gameConfig } from "@modules/state/base/stores"
  import { createRoom } from "./index"
  import { getUIState } from "@modules/ui/state.svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { walletNetwork } from "@modules/network"

  import CharacterCounter from "@components/Main/LeftContainer/CreateRoom/CharacterCounter.svelte"
  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"

  const { rooms, enums, panes } = getUIState()

  let {
    environment,
  }: {
    environment: ENVIRONMENT
  } = $props()

  let busy = $state(false)
  let roomDescription: string = $state("")
  let roomChallenge: string = $state("")
  let roomResult: string = $state("")

  let newName: string = $state("")

  let invalidRoomDescriptionLength = $derived(
    roomDescription.length < 1 ||
      roomDescription.length > $gameConfig.gameConfig.maxRoomPromptLength
  )

  let invalidRoomChallengeLength = $derived(
    roomChallenge.length < 1 ||
      roomChallenge.length > $gameConfig.gameConfig.maxRoomPromptLength
  )

  let invalidRoomResultLength = $derived(
    roomResult.length < 1 ||
      roomResult.length > $gameConfig.gameConfig.maxRoomPromptLength
  )

  let invalidNameLength = $derived(
    newName.length < 1 ||
      newName.length > $gameConfig.gameConfig.maxRoomNameLength
  )

  let disabled = $derived(
    invalidNameLength ||
      invalidRoomDescriptionLength ||
      invalidRoomChallengeLength ||
      invalidRoomResultLength ||
      busy ||
      $player.balance < 100
  )

  async function sendCreateRoom() {
    if (busy) return
    busy = true
    const newPrompt = `
    Description: ${roomDescription}
    Challenge: ${roomChallenge}
    Result: ${roomResult}
    `

    console.log("newPrompt", newPrompt)

    await createRoom(environment, $walletNetwork, newName, newPrompt)
    busy = false
    goYourRooms()
  }

  const goYourRooms = () => {
    rooms.back(true)
    panes.set(enums.PANE.LEFT, enums.LEFT_PANE.YOUR_ROOMS)
  }
</script>

<div class="create-room">
  {#if busy}
    <div class="loading-container">
      Room creation in progress...
      <Spinner />
    </div>
  {:else}
    <!-- INFO -->
    <div class="form-group">
      <div class="info">
        You're creating a room that can modify traits, items, health, and tokens
        of rats that enter. Your room balance decreases whenever a rat gains
        something, and increases when your room takes something. After 24 hours,
        you can withdraw any remaining balance from your room.
      </div>
    </div>

    <!-- NAME -->
    <div class="form-group">
      <label for="room-name">
        <span class="highlight">Room Name</span>
        <CharacterCounter
          currentLength={newName.length}
          maxLength={$gameConfig.gameConfig.maxRoomNameLength}
        />
      </label>
      <input disabled={busy} type="text" id="room-name" bind:value={newName} />
    </div>

    <!-- ROOM DESCRIPTION -->
    <div class="form-group">
      <label for="room-description">
        <span class="highlight">Room Description</span>
        <CharacterCounter
          currentLength={roomDescription.length}
          maxLength={$gameConfig.gameConfig.maxRoomPromptLength}
        />
      </label>
      <textarea
        disabled={busy}
        id="room-description"
        rows="3"
        bind:value={roomDescription}
      ></textarea>
    </div>

    <!-- ROOM CHALLENGE -->
    <div class="form-group">
      <label for="room-challenge">
        <span class="highlight">Room Challenge</span>
        <CharacterCounter
          currentLength={roomChallenge.length}
          maxLength={$gameConfig.gameConfig.maxRoomPromptLength}
        />
      </label>
      <textarea
        disabled={busy}
        id="room-challenge"
        rows="3"
        bind:value={roomChallenge}
      ></textarea>
    </div>

    <!-- ROOM RESULT -->
    <div class="form-group">
      <label for="room-result">
        <span class="highlight">Room Result</span>
        <CharacterCounter
          currentLength={roomResult.length}
          maxLength={$gameConfig.gameConfig.maxRoomPromptLength}
        />
      </label>
      <textarea
        disabled={busy}
        id="room-result"
        rows="3"
        bind:value={roomResult}
      ></textarea>
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <button class:disabled onclick={sendCreateRoom}>
        Create room (Cost: $100)
      </button>
      <button class="secondary" onclick={goYourRooms}> Cancel </button>
    </div>
  {/if}
</div>

<style lang="scss">
  .create-room {
    padding: 1rem;

    .form-group {
      margin-bottom: 15px;
      width: 100%;

      label {
        display: block;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .highlight {
          background: var(--color-alert);
          padding: 5px;
          color: black;
          font-weight: normal;
        }
      }

      input,
      textarea {
        width: 100%;
        padding: 5px;
        border: none;
        background: white;
        font-family: var(--typewriter-font-stack);
        font-size: var(--font-size-normal);
        border-radius: 0;
        resize: none;
        outline-color: var(--color-alert);
        outline-width: 1px;
      }
    }

    .info {
      background: var(--color-grey-light);
      padding: 15px;
      font-size: var(--font-size-small);
      color: black;
    }

    .actions {
      display: flex;
      flex-flow: column nowrap;
      gap: 12px;
      button {
        width: 100%;
        height: 40px;
        background: var(--color-alert);
        color: black;
        border: none;
        cursor: pointer;
        border: none;
        border-radius: 0;

        &.secondary {
          background: var(--color-grey-mid);
        }

        &.disabled {
          pointer-events: none;
          background: var(--color-grey-mid);
        }
      }
    }
  }
</style>
