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
    position: sticky;
    top: 0;
    z-index: var(--z-high);
    background: var(--background);

    button {
      width: 100%;
      height: 100%;
      background: var(--color-alert-priority);
      padding: 20px;
      border: none;

      &:hover {
        background: var(--color-grey-dark);
        color: var(--foreground);
      }
    }
  }
</style>
