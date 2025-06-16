<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"

  import BigButton from "@components/Main/Shared/Buttons/BigButton.svelte"

  const { enums, panes } = getUIState()

  const goCreateRoom = () => {
    panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.CREATE_ROOM)
  }
</script>

<div class="create-room-button">
  <BigButton text="Create Room" onclick={goCreateRoom} />
</div>

<style lang="scss">
  .create-room-button {
    height: var(--create-room-button-height);
    display: flex;
    justify-content: center;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: var(--z-high);
    background: var(--background);
    overflow: hidden;
  }
</style>
