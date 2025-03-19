<script lang="ts">
  import { onMount } from "svelte"
  import { getUIState } from "@modules/ui/state.svelte"
  import RoomsListing from "@components/Room/RoomsListing.svelte"

  const { enums, panes } = getUIState()

  onMount(() => {
    console.log("RightContainer component mounted")
  })
</script>

<div class="right-container">
  {#if panes.right === enums.RIGHT_PANE.ROOMS}
    <RoomsListing />
  {/if}
</div>

<style>
  .right-container {
    width: calc(50% - 80px);
    border-bottom: 1px solid white;
    height: calc(100% - 60px);
  }
</style>
