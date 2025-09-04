<script lang="ts">
  import { gameConfig, playerERC20Balance, rooms } from "$lib/modules/state/stores"
  import { CharacterCounter, VideoLoaderDuration, BigButton } from "$lib/components/Shared"
  import { sendCreateRoom } from "$lib/modules/action-manager/index.svelte"
  import { goto } from "$app/navigation"
  import { typeHit } from "$lib/modules/sound"
  import { errorHandler } from "$lib/modules/error-handling"
  import { CharacterLimitError, InputValidationError } from "$lib/modules/error-handling/errors"
  import { waitForPropertyChange } from "$lib/modules/state/utils"
  import {
    MIN_ROOM_CREATION_COST,
    MIN_RAT_VALUE_TO_ENTER_FACTOR,
    MAX_VALUE_PER_WIN_FACTOR
  } from "@server/config"

  let roomDescription: string = $state("")
  let busy: boolean = $state(false)

  // Prompt has to be between 1 and MAX_ROOM_PROMPT_LENGTH characters
  const invalidRoomDescriptionLength = $derived(
    roomDescription.length < 1 || roomDescription.length > $gameConfig.maxRoomPromptLength
  )

  let roomCreationCost = $state(200)

  // 10% of room creation cost
  let minRatValueToEnter = $derived(Math.floor(roomCreationCost * MIN_RAT_VALUE_TO_ENTER_FACTOR))
  // 25% of room creation cost
  let maxValuePerWin = $derived(Math.floor(roomCreationCost * MAX_VALUE_PER_WIN_FACTOR))

  // Disabled if:
  // - Room description is invalid
  // - Room creation is busy
  // - Max value per win is not set
  // - Min rat value to enter is not set
  // - Room creation cost is less than minimum
  // - Player has insufficient balance
  const disabled = $derived(
    invalidRoomDescriptionLength ||
      busy ||
      !maxValuePerWin ||
      !minRatValueToEnter ||
      (roomCreationCost ?? 0) < MIN_ROOM_CREATION_COST ||
      $playerERC20Balance < Number(roomCreationCost)
  )

  const placeholder =
    "You're creating a trip that can modify items, and tokens of rats that enter. Your trip balance decreases whenever a rat gains something, and increases when your trip takes something. You can withdraw remaining balance from your trip."

  async function onClick() {
    busy = true
    try {
      // Validate room description before sending
      if (!roomDescription || roomDescription.trim() === "") {
        throw new InputValidationError(
          "Trip description cannot be empty",
          "roomDescription",
          roomDescription
        )
      }
      if (roomDescription.length > $gameConfig.maxRoomPromptLength) {
        throw new CharacterLimitError(
          roomDescription.length,
          $gameConfig.maxRoomPromptLength,
          "room description"
        )
      }
      const result = await sendCreateRoom(roomDescription, roomCreationCost)

      if (result?.roomId) {
        // Wait for created room to be available in the store
        await waitForPropertyChange(rooms, result.roomId, undefined, 10000)
        goto(`/admin/${result.roomId}`)
        busy = false
      }
    } catch (error) {
      errorHandler(error)
      roomDescription = ""
    }
    roomDescription = ""
  }
</script>

<div class="create-room">
  {#if busy}
    <VideoLoaderDuration duration={6000} />
  {:else}
    <!-- ROOM DESCRIPTION -->
    <div class="form-group">
      <label for="room-description">
        <span class="highlight">Trip Description</span>
        <CharacterCounter
          currentLength={roomDescription.length}
          maxLength={$gameConfig.maxRoomPromptLength}
        />
      </label>
      <textarea
        disabled={busy}
        id="room-description"
        rows="6"
        {placeholder}
        oninput={typeHit}
        bind:value={roomDescription}
      ></textarea>
    </div>

    <!-- ROOM CREATION COST -->
    <div class="form-group-small">
      <label for="room-creation-cost">
        <span class="highlight">ROOM CREATION COST</span>
      </label>
      <input type="number" id="room-creation-cost" bind:value={roomCreationCost} />
    </div>

    <!-- MAX VALUE PER WIN -->
    <div class="form-group-small">
      <label for="max-value-per-win">
        <span class="highlight">MAX VALUE PER WIN</span>
      </label>
      <div>${maxValuePerWin}</div>
    </div>

    <!-- MIN RAT VALUE TO ENTER -->
    <div class="form-group-small">
      <label for="min-rat-value-to-enter">
        <span class="highlight">MIN RAT VALUE TO ENTER</span>
      </label>
      <div>${minRatValueToEnter}</div>
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <BigButton text="Create trip" cost={Number(roomCreationCost)} {disabled} onclick={onClick} />
    </div>
  {/if}
</div>

<style lang="scss">
  .create-room {
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
    background-image: url("/images/texture-3.png");
    background-size: 200px;

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

      .form-group-small {
        padding: 1rem;
        display: block;
        margin-bottom: 0;
        width: 100%;
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
