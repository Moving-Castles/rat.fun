<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"
  const { enums, panes, rooms } = getUIState()
</script>

<div class="pane-switch">
  <button
    onclick={() => {
      panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.ALL_ROOMS)
      rooms.back()
    }}
    class:selected={panes.roomContainer === enums.ROOM_CONTAINER.ALL_ROOMS}
    class="pane-switch-item"
  >
    ALL ROOMS
  </button>
  <button
    onclick={() => {
      panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.YOUR_ROOMS)
      rooms.back(true)
    }}
    class:selected={[
      enums.ROOM_CONTAINER.YOUR_ROOMS,
      enums.ROOM_CONTAINER.CREATE_ROOM,
    ].includes(panes.roomContainer)}
    class="pane-switch-item"
  >
    YOUR ROOMS
  </button>
</div>

<style lang="scss">
  .pane-switch {
    display: flex;
    flex-direction: row;
    border-bottom: var(--default-border-style);
    height: var(--pane-switch-height);
    line-height: var(--pane-switch-height);

    .pane-switch-item {
      text-align: center;
      padding-inline: 20px;
      border: none;
      outline: none;
      font-family: var(--label-font-stack);
      font-size: var(--font-size-large);
      background: var(--color-grey-mid);
      color: var(--background);
      width: 50%;

      &:hover {
        background: var(--color-grey-light);
      }

      &.selected {
        background: var(--color-alert);
        color: var(--foreground);
      }
    }
  }
</style>
