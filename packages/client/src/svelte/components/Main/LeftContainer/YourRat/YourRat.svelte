<script lang="ts">
  import { player } from "@modules/state/base/stores"
  import RatEditor from "@components/Main/LeftContainer/YourRat/RatEditor.svelte"
  import RatCam from "@components/Main/LeftContainer/YourRat/RatCam.svelte"
  import FloorProgress from "@components/Main/LeftContainer/YourRat/FloorProgress.svelte"
  import LiquidateRat from "@components/Main/LeftContainer/YourRat/LiquidateRat.svelte"
  import DeployRat from "@components/Main/LeftContainer/DeployRat/DeployRat.svelte"
</script>

<div class="your-rat">
  {#if $player?.ownedRat}
    <RatEditor />
    <RatCam />
    <FloorProgress />
    <LiquidateRat />
  {:else}
    <DeployRat />
  {/if}
</div>

<style lang="scss">
  .your-rat {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }
</style>
