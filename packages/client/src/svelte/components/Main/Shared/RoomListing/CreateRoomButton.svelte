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
    overflow: hidden;

    button {
      width: 100%;
      height: 100%;
      background: var(--color-alert-priority);
      border: none;
      letter-spacing: -0.2em;
      font-size: var(--font-size-extra-large);
      font-family: var(--label-font-stack);
      transition: transform 0.2s ease-in-out;

      &:hover {
        background: var(--color-alert-priority);
        color: var(--background);
        transform: scale(1.3);
      }
    }
  }
</style>
