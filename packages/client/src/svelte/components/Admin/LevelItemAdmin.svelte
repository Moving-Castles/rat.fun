<script lang="ts">
  import { updateLevel } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"

  export let level: Level
  export let levelId: string

  let newLevelUpCost = level.levelUpCost
  let newRoomCreationCost = level.roomCreationCost
  let busy = false

  async function sendUpdateLevel() {
    busy = true
    const action = updateLevel(levelId, newLevelUpCost, newRoomCreationCost)
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
      newLevelUpCost = level.levelUpCost
      newRoomCreationCost = level.roomCreationCost
    }
  }
</script>

<div class="level" class:disabled={busy}>
  <!-- INDEX -->
  <div class="level-item">
    <div class="value alert">{level.index}</div>
  </div>
  <!-- Level up cost -->
  <div class="level-item">
    <div class="value">{level.levelUpCost}</div>
    <input type="number" bind:value={newLevelUpCost} />
  </div>
  <!-- Room creation cost -->
  <div class="level-item">
    <div class="value">{level.roomCreationCost}</div>
    <input type="number" bind:value={newRoomCreationCost} />
  </div>
  <!-- Action -->
  <div class="level-item">
    <button onclick={sendUpdateLevel}>Update</button>
  </div>
</div>

<style lang="scss">
  .level {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #ccc;
    font-size: 14px;
  }

  .disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .level-item {
    display: flex;
  }

  input {
    width: 50px;
    background: var(--color-grey-light);
    position: relative;
    top: -5px;
    margin-left: 5px;
  }

  button {
    background: var(--color-alert);
    color: var(--black);
    cursor: pointer;
  }

  .alert {
    font-weight: bold;
  }
</style>
