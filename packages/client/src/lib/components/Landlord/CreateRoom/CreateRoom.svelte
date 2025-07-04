<script lang="ts">
  import { rat, gameConfig, levels, playerERC20Balance } from "$lib/modules/state/base/stores"
  import { CharacterCounter, VideoLoader, BigButton } from "$lib/components/Shared"
  import { busy, sendCreateRoom } from "$lib/modules/action-manager/index.svelte"
  import { typeHit } from "$lib/modules/sound"

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
        disabled={busy.CreateRoom.current !== 0}
        onclick={async () => {
          try {
            await sendCreateRoom(roomDescription, levelId, roomCreationCost)
          } catch {
            roomDescription = ""
          }
          roomDescription = ""
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
      // margin-inline: 1rem;
      overflow: hidden;
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
