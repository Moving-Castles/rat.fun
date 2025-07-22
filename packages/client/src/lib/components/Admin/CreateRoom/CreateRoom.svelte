<script lang="ts">
  import { rat, gameConfig, levels, playerERC20Balance, rooms } from "$lib/modules/state/stores"
  import { CharacterCounter, VideoLoaderDuration, BigButton } from "$lib/components/Shared"
  import { sendCreateRoom } from "$lib/modules/action-manager/index.svelte"
  import { goto } from "$app/navigation"
  import { typeHit } from "$lib/modules/sound"
  import { waitForPropertyChange } from "$lib/modules/state/utils"

  let roomDescription: string = $state("")
  let levelId: string = $state($rat?.level ?? $gameConfig.levelList[0])
  let busy: boolean = $state(false)

  // Prompt has to be between 1 and MAX_ROOM_PROMPT_LENGTH characters
  const invalidRoomDescriptionLength = $derived(
    roomDescription.length < 1 ||
      roomDescription.length > $gameConfig.gameConfig.maxRoomPromptLength
  )

  const roomCreationCost = $derived(
    $levels[levelId]?.roomCreationCost ?? $levels[$gameConfig.levelList[0]]?.roomCreationCost ?? 0
  )

  // Disabled if:
  // - Room description is invalid
  // - Room creation is busy
  // - Player has insufficient balance
  const disabled = $derived(
    invalidRoomDescriptionLength ||
      busy ||
      $playerERC20Balance < Number($levels[levelId].roomCreationCost ?? 0)
  )

  const placeholder =
    "You're creating a room that can modify traits, items, health, and tokens of rats that enter. Your room balance decreases whenever a rat gains something, and increases when your room takes something. You can withdraw remaining balance from your room."

  async function onClick() {
    busy = true
    try {
      const result = await sendCreateRoom(roomDescription, levelId, roomCreationCost)
      if (result?.roomId) {
        // Wait for created room to be available in the store
        await waitForPropertyChange(rooms, result.roomId, undefined, 10000)
        goto(`/admin/${result.roomId}`)
        busy = false
      }
    } catch {
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
        {placeholder}
        oninput={typeHit}
        bind:value={roomDescription}
      ></textarea>
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <BigButton text="Create room" cost={Number(roomCreationCost)} {disabled} onclick={onClick} />
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
