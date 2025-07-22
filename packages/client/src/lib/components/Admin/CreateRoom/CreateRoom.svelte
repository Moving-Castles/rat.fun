<script lang="ts">
  import { rat, gameConfig, levels, playerERC20Balance } from "$lib/modules/state/stores"
  import { CharacterCounter, VideoLoader, BigButton } from "$lib/components/Shared"
  import { busy, sendCreateRoom } from "$lib/modules/action-manager/index.svelte"
  import { typeHit } from "$lib/modules/sound"
  import { errorHandler } from "$lib/modules/error-handling"
  import { CharacterLimitError, InputValidationError } from "$lib/modules/error-handling/errors"

  let roomDescription: string = $state("")
  let levelId: string = $state($rat?.level ?? $gameConfig.levelList[0])

  let invalidRoomDescriptionLength = $derived(
    roomDescription.length < 1 ||
      roomDescription.length > $gameConfig.gameConfig.maxRoomPromptLength
  )

  let disabled = $derived(
    invalidRoomDescriptionLength ||
      busy.CreateRoom.current !== 0 ||
      $playerERC20Balance < Number($levels[levelId].roomCreationCost ?? 0)
  )

  let roomCreationCost = $derived(
    $levels[levelId]?.roomCreationCost ?? $levels[$gameConfig.levelList[0]]?.roomCreationCost ?? 0
  )
</script>

<div class="create-room">
  {#if busy.CreateRoom.current !== 0}
    <VideoLoader progress={busy.CreateRoom} />
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
        disabled={busy.CreateRoom.current !== 0}
        id="room-description"
        rows="6"
        placeholder="You're creating a room that can modify traits, items, health, and tokens of rats that enter. Your room balance decreases whenever a rat gains something, and increases when your room takes something. You can withdraw remaining balance from your room."
        oninput={typeHit}
        bind:value={roomDescription}
      ></textarea>
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <BigButton
        text="Create room"
        cost={Number(roomCreationCost)}
        {disabled}
        onclick={async () => {
          try {
            // Validate room description before sending
            if (!roomDescription || roomDescription.trim() === "") {
              throw new InputValidationError(
                "Room description cannot be empty",
                "roomDescription",
                roomDescription
              )
            }

            if (roomDescription.length > $gameConfig.gameConfig.maxRoomPromptLength) {
              throw new CharacterLimitError(
                roomDescription.length,
                $gameConfig.gameConfig.maxRoomPromptLength,
                "room description"
              )
            }

            await sendCreateRoom(roomDescription, levelId, roomCreationCost)
            roomDescription = ""
          } catch (error) {
            errorHandler(error)
            roomDescription = ""
          }
        }}
      />
    </div>
  {/if}
</div>

<style lang="scss">
  .create-room {
    height: 100%;
    background: var(--black);
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;

    .form-group {
      padding: 1rem;
      display: block;
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

    .actions {
      display: flex;
      flex-flow: column nowrap;
      gap: 12px;
      overflow: hidden;
    }
  }
</style>
