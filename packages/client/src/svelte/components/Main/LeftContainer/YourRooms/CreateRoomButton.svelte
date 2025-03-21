<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"

  const { enums, panes } = getUIState()

  const goCreateRoom = () => {
    panes.set(enums.PANE.LEFT, enums.LEFT_PANE.CREATE_ROOM)
  }
</script>

<div class="create-room-button">
  <button onclick={goCreateRoom}>Create Room</button>
</div>

<style lang="scss">
  .create-room-button {
    height: var(--create-room-button-height);
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid white;
    padding: var(--default-padding);
  }
</style>
