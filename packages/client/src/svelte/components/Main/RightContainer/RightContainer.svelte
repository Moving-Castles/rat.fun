<script lang="ts">
  import { getUIState } from "@modules/ui/state.svelte"
  import RoomsListing from "@components/Main/Shared/RoomsListing/RoomsListing.svelte"

  const { enums, panes } = getUIState()
</script>

<div class="right-container">
  {#if panes.right === enums.RIGHT_PANE.ROOMS}
    <RoomsListing isOwnRoomListing={false} pane={enums.PANE.RIGHT} />
  {/if}
</div>

<style lang="scss">
  .right-container {
    width: calc(50% - 80px);
    border-bottom: 1px solid white;
    height: 100%;
  }
</style>
