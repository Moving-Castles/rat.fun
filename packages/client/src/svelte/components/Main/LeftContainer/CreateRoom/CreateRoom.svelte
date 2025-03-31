<script lang="ts">
  import { player, gameConfig } from "@modules/state/base/stores"
  import { createRoom } from "./index"
  import { getUIState } from "@modules/ui/state.svelte"
  import { ENVIRONMENT } from "@mud/enums"
  import { walletNetwork } from "@modules/network"
  import CharacterCounter from "@components/Main/LeftContainer/CreateRoom/CharacterCounter.svelte"

  const { enums, panes } = getUIState()

  let {
    environment,
  }: {
    environment: ENVIRONMENT
  } = $props()

  let busy = $state(false)
  let newPrompt: string = $state("")
  let newName: string = $state("")

  let invalidPromptLength = $derived(
    newPrompt.length < $gameConfig.gameConfig.minRoomPromptLength ||
      newPrompt.length > $gameConfig.gameConfig.maxRoomPromptLength
  )

  let invalidNameLength = $derived(
    newName.length < $gameConfig.gameConfig.minRoomNameLength ||
      newName.length > $gameConfig.gameConfig.maxRoomNameLength
  )

  let disabled = $derived(
    invalidNameLength || invalidPromptLength || busy || $player.balance < 100
  )

  async function sendCreateRoom() {
    if (busy) return
    busy = true
    const result = await createRoom(
      environment,
      $walletNetwork,
      newName,
      newPrompt
    )
    console.log("result in component", result)
    busy = false
    goYourRooms()
  }

  const goYourRooms = () => {
    panes.set(enums.PANE.LEFT, enums.LEFT_PANE.YOUR_ROOMS)
  }

  console.log("create room component mounted")
</script>

<div class="create-room">
  <div class="form-group">
    <label for="room-name">Room Name</label>
    <input disabled={busy} type="text" id="room-name" bind:value={newName} />
    <CharacterCounter
      currentLength={newName.length}
      maxLength={$gameConfig.gameConfig.maxRoomNameLength}
      minLength={$gameConfig.gameConfig.minRoomNameLength}
      label="Name"
    />
  </div>

  <div class="form-group">
    <label for="room-prompt">Room Prompt</label>
    <textarea disabled={busy} id="room-prompt" rows="5" bind:value={newPrompt}
    ></textarea>
    <CharacterCounter
      currentLength={newPrompt.length}
      maxLength={$gameConfig.gameConfig.maxRoomPromptLength}
      minLength={$gameConfig.gameConfig.minRoomPromptLength}
      label="Prompt"
    />
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
