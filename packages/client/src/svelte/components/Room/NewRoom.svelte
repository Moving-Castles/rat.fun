<script lang="ts">
  import { createRoom } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { player, gameConfig } from "@modules/state/base/stores"

  let busy = false
  let newPrompt: string = ""

  $: invalidPromptLength =
    newPrompt.length < 1 ||
    newPrompt.length > $gameConfig.gameConfig.maxRoomPromptLength

  async function sendCreateRoom() {
    busy = true
    const action = createRoom("test name", newPrompt)
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
      newPrompt = ""
    }
  }
</script>

<div class="create-room">
  <textarea rows="5" placeholder="Room prompt" bind:value={newPrompt}
  ></textarea>
  <div class="actions">
    <!-- SUBMIT -->
    <button
      disabled={invalidPromptLength || busy || $player.balance < 100}
      on:click={sendCreateRoom}
    >
      Create room (Cost: $100)
    </button>
    <!-- PROMPT LENGHT -->
    <div class="prompt-length" class:invalid={invalidPromptLength}>
      {newPrompt.length} / {$gameConfig.gameConfig.maxRoomPromptLength}
    </div>
  </div>
</div>

<style lang="scss">
  .create-room {
    width: 100%;
    padding: 10px;
    background: var(--color-grey-mid);

    textarea {
      width: 100%;
      padding: 5px;
      background: var(--color-grey-light);
      font-family: var(--typewrite-stack);
      outline-color: var(--color-alert);
      border-radius: 0;
      font-size: var(--font-size-normal);
      border: none;
    }
    .actions {
      display: flex;
      justify-content: space-between;

      button {
        padding: 10px;
        margin-top: 10px;
        cursor: pointer;
        font-size: var(--font-size-normal);
        background: var(--color-secondary);

        &:active {
          background: var(--color-alert);
        }
      }

      .prompt-length {
        margin-top: 10px;
        padding: 10px;

        &.invalid {
          background: var(--color-death);
        }
      }
    }
  }
</style>
