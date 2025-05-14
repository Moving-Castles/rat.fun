<script lang="ts">
  import { player, gameConfig, levels } from "@modules/state/base/stores"
  import { createRoom } from "./index"
  import { getUIState } from "@modules/ui/state.svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { walletNetwork } from "@modules/network"
  import { initStaticContent } from "@modules/content"

  import CharacterCounter from "@components/Main/RoomContainer/CreateRoom/CharacterCounter.svelte"
  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"

  const { rooms, enums, panes } = getUIState()

  let {
    environment,
  }: {
    environment: ENVIRONMENT
  } = $props()

  let busy = $state(false)
  let roomDescription: string = $state("")
  let levelId: string = $state(
    $player.visitedLevels.length > 0
      ? (Object.entries($levels).find(([key]) =>
          $player.visitedLevels.includes(key as `0x${string}`)
        )?.[0] ?? "")
      : ""
  )

  let invalidRoomDescriptionLength = $derived(
    roomDescription.length < 1 ||
      roomDescription.length > $gameConfig.gameConfig.maxRoomPromptLength
  )

  let disabled = $derived(
    invalidRoomDescriptionLength ||
      busy ||
      $player.balance < Number($gameConfig?.gameConfig?.roomCreationCost ?? 0)
  )

  async function sendCreateRoom() {
    if (busy) return
    busy = true
    const newPrompt = roomDescription

    await createRoom(environment, $walletNetwork, newPrompt, levelId)
    busy = false
    await initStaticContent()

    goYourRooms()
  }

  const goYourRooms = () => {
    rooms.back(true)
    panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.YOUR_ROOMS)
  }
</script>

<div class="create-room">
  {#if busy}
    <div class="loading-container">
      Room creation in progress...
      <Spinner />
    </div>
  {:else}
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
        rows="6"
        placeholder="You're creating a room that can modify traits, items, health, and tokens of rats that enter. Your room balance decreases whenever a rat gains something, and increases when your room takes something. You can withdraw remaining balance from your room."
        bind:value={roomDescription}
      ></textarea>
    </div>

    <!-- LEVEL SELECTION -->
    <div class="form-group">
      <label for="level-select">
        <span class="highlight">Select Level</span>
      </label>
      <select id="level-select" bind:value={levelId} disabled={busy}>
        {#each Object.entries($levels).filter( ([key]) => $player.visitedLevels.includes(key as `0x${string}`) ) as [key, level]}
          <option value={key}>{level.index}</option>
        {/each}
      </select>
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <button class:disabled onclick={sendCreateRoom}>
        Create room (Cost: ${Number($gameConfig?.gameConfig?.roomCreationCost)})
      </button>
      <button class="secondary" onclick={goYourRooms}>Cancel</button>
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
          color: var(--background);
          font-weight: normal;
        }
      }

      input,
      textarea {
        width: 100%;
        padding: 5px;
        border: none;
        background: var(--foreground);
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
      color: var(--background);
    }

    .actions {
      display: flex;
      flex-flow: column nowrap;
      gap: 12px;

      button {
        width: 100%;
        height: 40px;
        background: var(--color-alert-priority);
        color: var(--background);
        cursor: pointer;
        border-radius: 0;
        border: var(--default-border-style);

        &.secondary {
          background: var(--color-grey-mid);
        }

        &:hover {
          background: var(--color-alert);
          color: var(--foreground);
        }

        &.disabled {
          pointer-events: none;
          background: var(--color-grey-mid);
        }
      }
    }
  }
</style>
