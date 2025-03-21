<script lang="ts">
  import { gameConfig } from "@modules/state/base/stores"
  import { createRoomAsAdmin } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"

  let busy = false
  let newRoomPrompt: string = ""
  let newRoomLevelIndex: number = 1
  let newRoomExtraBalance: number = 0

  async function sendCreateRoom() {
    if (busy) return
    busy = true
    const action = createRoomAsAdmin(
      "Test room",
      newRoomPrompt,
      $gameConfig?.levelList?.[newRoomLevelIndex],
      newRoomExtraBalance
    )
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
      newRoomPrompt = ""
    }
  }
</script>

<div class="create-room">
  <!-- PROMPT -->
  <textarea rows="5" placeholder="Room prompt" bind:value={newRoomPrompt}>
  </textarea>
  <!-- LEVEL -->
  <div class="input-group">
    Level:
    <input
      type="number"
      placeholder="Level"
      min="0"
      max="5"
      bind:value={newRoomLevelIndex}
    />
  </div>
  <!-- EXTRA BALANCE -->
  <div class="input-group">
    Extra balance:
    <input
      type="number"
      placeholder="Extra balance"
      min="0"
      bind:value={newRoomExtraBalance}
    />
  </div>
  <div class="actions">
    <!-- SUBMIT -->
    <button disabled={busy} onclick={sendCreateRoom}> Create room </button>
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
    }
  }

  .input-group {
    margin-top: 10px;
  }
</style>
