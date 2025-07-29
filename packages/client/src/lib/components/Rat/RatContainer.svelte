<script lang="ts">
  import RatBox from "$lib/components/Rat/RatBox/RatBox.svelte"
  import { player } from "$lib/modules/state/stores"
  import { ChatBox } from "$lib/components/Shared"
</script>

<div class="rat-container">
  {#if $player}
    <RatBox />
  {/if}
  <ChatBox />
</div>

<style lang="scss">
  .rat-container {
    height: calc(var(--game-window-height) - 60px);
    width: 100%;
    display: grid;
    grid-template-rows: 440px minmax(100px, 1fr);
  }
</style>
