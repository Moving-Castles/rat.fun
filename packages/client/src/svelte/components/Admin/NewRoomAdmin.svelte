<script lang="ts">
  import { createRoomAsAdmin } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { ROOM_TYPE } from "contracts/enums"

  let busy = false
  let newRoomPrompt: string = ""
  let newRoomLevel: number = 1
  let newRoomType: ROOM_TYPE = ROOM_TYPE.ONE_PLAYER // or ROOM_TYPE.TWO_PLAYER

  async function sendCreateRoom() {
    busy = true
    const action = createRoomAsAdmin(newRoomPrompt, newRoomType, newRoomLevel)
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
      min="1"
      max="10"
      bind:value={newRoomLevel}
    />
  </div>
  <!-- ROOM TYPE -->
  <div class="input-group">
    <label>
      <input
        type="radio"
        name="roomType"
        value={ROOM_TYPE.ONE_PLAYER}
        bind:group={newRoomType}
      />
      One Player
    </label>
    <label>
      <input
        type="radio"
        name="roomType"
        value={ROOM_TYPE.TWO_PLAYER}
        bind:group={newRoomType}
      />
      Two Player
    </label>
  </div>
  <div class="actions">
    <!-- SUBMIT -->
    <button disabled={busy} on:click={sendCreateRoom}> Create room </button>
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
