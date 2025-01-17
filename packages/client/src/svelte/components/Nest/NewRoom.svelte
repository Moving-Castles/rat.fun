<script lang="ts">
  import { createRoom } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { player } from "@modules/state/base/stores"

  let busy = false
  let newPrompt: string

  async function sendCreateRoom() {
    busy = true
    const action = createRoom(newPrompt)
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
  <textarea rows="5" cols="50" placeholder="Room prompt" bind:value={newPrompt}
  ></textarea>
  <button disabled={busy || $player.balance < 100} on:click={sendCreateRoom}>
    Create room
  </button>
</div>

<style lang="scss">
  .create-room {
    width: 100%;
    padding: 20px;
    background: lightblue;

    button {
      width: 200px;
      padding: 5px;
      margin-top: 20px;
      cursor: pointer;
    }
  }
</style>
