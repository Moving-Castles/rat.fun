<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"

  const { enums, panes } = getUIState()

  const goCreateRoom = () => {
    panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.CREATE_ROOM)
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
    border-bottom: var(--default-border-style);
    padding: var(--default-padding);
    position: sticky;
    top: 0;
    z-index: 1;
    background: black;

    button {
      width: 100%;
      background: var(--color-alert);
      padding: 20px;
    }
  }
</style>
