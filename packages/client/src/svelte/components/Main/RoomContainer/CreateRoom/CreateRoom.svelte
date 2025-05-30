<script lang="ts">
  import { player, rat, gameConfig, levels } from "@modules/state/base/stores"
  import { createRoom } from "./index"
  import { getUIState } from "@modules/ui/state.svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { walletNetwork } from "@modules/network"

  import CharacterCounter from "@components/Main/RoomContainer/CreateRoom/CharacterCounter.svelte"
  import VideoLoader from "@components/Main/Shared/VideoLoader/VideoLoader.svelte"

  const { rooms } = getUIState()

  let {
    environment,
  }: {
    environment: ENVIRONMENT
  } = $props()

  let busy = $state(false)
  let roomDescription: string = $state("")
  let levelId: string = $state($rat?.level ?? $gameConfig.levelList[0])

  let invalidRoomDescriptionLength = $derived(
    roomDescription.length < 1 ||
      roomDescription.length > $gameConfig.gameConfig.maxRoomPromptLength
  )

  let disabled = $derived(
    invalidRoomDescriptionLength ||
      busy ||
      $player.balance < Number($levels[levelId].roomCreationCost ?? 0)
  )

  async function sendCreateRoom() {
    if (busy) return
    busy = true
    const newPrompt = roomDescription

    const result = await createRoom(
      environment,
      $walletNetwork,
      newPrompt,
      levelId
    )
    busy = false

    if (result.roomId) {
      busy = false
      // Go to the preview
      rooms.preview(result.roomId, false, false)
    }
  }
</script>

<div class="create-room">
  {#if busy}
    <VideoLoader />
  {:else}
    <!-- LEVEL SELECTION -->
    <div class="form-group level-selection">
      <label for="level-toggles">
        <span class="highlight">Select floor</span>
      </label>
      <div
        id="level-toggles"
        class="level-toggles"
        role="radiogroup"
        aria-label="Select level"
      >
        {#each Object.entries($levels) as [key, level]}
          <button
            class:active={levelId === key}
            class:disabled={!$player.visitedLevels.includes(
              key as `0x${string}`
            )}
            onclick={() => (levelId = key)}
            disabled={!$player.visitedLevels.includes(key as `0x${string}`)}
          >
            {Number(level.index) * -1}
          </button>
        {/each}
      </div>

      <div class="level-description">
        <div class="level-name">
          Floor {Number($levels[levelId].index) * -1}: {$levels[levelId].name}
        </div>
        {#if $levels[levelId].prompt}
          <div class="level-prompt">
            {$levels[levelId].prompt}
          </div>
        {/if}
      </div>
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
        rows="6"
        placeholder="You're creating a room that can modify traits, items, health, and tokens of rats that enter. Your room balance decreases whenever a rat gains something, and increases when your room takes something. You can withdraw remaining balance from your room."
        bind:value={roomDescription}
      ></textarea>
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <button class:disabled onclick={sendCreateRoom}>
        Create room (Cost: ${Number(
          $levels[levelId]?.roomCreationCost ??
            $levels[$gameConfig.levelList[0]]?.roomCreationCost ??
            666
        )})
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  .create-room {
    height: 100%;

    .form-group {
      padding: 1rem;
      display: block;
      margin-bottom: 15px;
      width: 100%;

      &.level-selection {
        margin-top: 15px;
        padding-top: 15px;
        padding-bottom: 15px;
        border-top: var(--default-border-style);
        border-bottom: var(--default-border-style);
      }

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

      .level-toggles {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        button {
          width: 40px;
          height: 40px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--foreground);
          border: var(--default-border-style);
          cursor: pointer;
          font-family: var(--typewriter-font-stack);
          font-size: var(--font-size-normal);

          &.active {
            background: var(--color-alert-priority);
            color: var(--background);
          }

          &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          &:not(.disabled):hover {
            background: var(--color-alert);
            color: var(--background);
          }
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
      margin-inline: 1rem;

      button {
        width: 100%;
        height: 60px;
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

  .level-description {
    display: flex;
    flex-flow: column nowrap;
    gap: 12px;
    background: var(--color-grey-dark);
    padding: 10px;
    margin-top: 10px;
    max-width: 50ch;

    .level-name {
      border-bottom: var(--default-border-style);
      color: var(--color-grey-light);
    }

    .level-prompt {
      font-family: var(--special-font-stack);
      font-size: 20px;
    }
  }
</style>
