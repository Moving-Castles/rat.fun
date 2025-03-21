<script lang="ts">
  import { createRoom } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { player, gameConfig } from "@modules/state/base/stores"
  import { getUIState } from "@modules/ui/state.svelte"

  const { enums, panes } = getUIState()

  let busy = $state(false)
  let newPrompt: string = $state("")
  let newName: string = $state("")

  let invalidPromptLength = $derived(
    newPrompt.length < 1 ||
      newPrompt.length > $gameConfig.gameConfig.maxRoomPromptLength
  )

  let disabled = $derived(invalidPromptLength || busy || $player.balance < 100)

  async function sendCreateRoom() {
    if (busy) return
    busy = true
    const action = createRoom(newName, newPrompt)
    try {
      await waitForCompletion(action)
      console.log(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
      newPrompt = ""
      goYourRooms()
    }
  }

  const goYourRooms = () => {
    panes.set(enums.PANE.LEFT, enums.LEFT_PANE.YOUR_ROOMS)
  }
</script>

<div class="create-room">
  <div class="form-group">
    <label for="room-name">Room Name</label>
    <input disabled={busy} type="text" id="room-name" bind:value={newName} />
  </div>

  <div class="form-group">
    <label for="room-prompt">Room Prompt</label>
    <textarea disabled={busy} id="room-prompt" rows="5" bind:value={newPrompt}
    ></textarea>
  </div>

  <div class="actions">
    <button {disabled} onclick={sendCreateRoom}>
      Create room (Cost: $100)
    </button>
  </div>
</div>

<style lang="scss">
  .create-room {
    padding: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
    width: 100%;

    label {
      display: block;
      margin-bottom: 0.5rem;
    }

    input,
    textarea {
      width: 100%;
      padding: 0.5rem;
    }
  }

  .actions {
    button {
      width: 100%;
      height: 40px;
      background: white;
      color: black;
      border: none;
      cursor: pointer;

      &[disabled] {
        background: grey;
      }
    }
  }
</style>
