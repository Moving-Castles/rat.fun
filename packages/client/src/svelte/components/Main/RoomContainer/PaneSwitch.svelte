<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"
  const { enums, panes, rooms } = getUIState()
</script>

<div class="pane-switch">
  <!-- ALL ROOMS -->
  <div
    class="pane-switch-item"
    class:selected={panes.roomContainer === enums.ROOM_CONTAINER.ALL_ROOMS}
  >
    <button
      onclick={() => {
        panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.ALL_ROOMS)
        rooms.back()
      }}
    >
      ALL ROOMS
    </button>
  </div>
  <!-- YOUR ROOMS -->
  <div
    class="pane-switch-item"
    class:selected={[
      enums.ROOM_CONTAINER.YOUR_ROOMS,
      enums.ROOM_CONTAINER.CREATE_ROOM,
    ].includes(panes.roomContainer)}
  >
    <button
      onclick={() => {
        panes.set(enums.PANE.ROOM_CONTAINER, enums.ROOM_CONTAINER.YOUR_ROOMS)
        rooms.back(true)
      }}
    >
      YOUR ROOMS
    </button>
  </div>
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
      background: var(--color-grey-mid);
      color: var(--background);
      width: 50%;

      button {
        width: 100%;
        height: 100%;
        border: none;
        outline: none;
        background: transparent;
        color: var(--background);
        font-family: var(--label-font-stack);
        font-size: var(--font-size-large);
        letter-spacing: -0.2em;
      }

      &:hover {
        background: var(--color-grey-light);

        button {
          transform: scale(1.4);
          transition: transform 0.2s ease-in-out;
        }
      }

      &.selected {
        background: var(--color-alert);
        color: var(--foreground);

        &:hover {
          // background: var(--color-alert-priority);
        }
      }
    }
  }
</style>
