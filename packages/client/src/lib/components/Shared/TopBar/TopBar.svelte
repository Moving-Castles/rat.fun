<script lang="ts">
  import { player, worldStats, activeWorldEvent } from "$lib/modules/state/stores"

  import OperatorInfo from "./PlayerInfo.svelte"
  import PaneSwitch from "./PaneSwitch.svelte"
  import WorldEvent from "./WorldEvent.svelte"
  import GlobalStats from "./GlobalStats.svelte"
</script>

<div class="top-bar">
  <OperatorInfo />
  {#if $worldStats}
    <GlobalStats />
  {/if}
  {#if $activeWorldEvent}
    <WorldEvent />
  {/if}
  {#if $player?.masterKey}
    <PaneSwitch />
  {/if}
</div>

<style lang="scss">
  .top-bar {
    width: 100%;
    max-width: 100%;
    border-bottom: var(--default-border-style);
    display: flex;
    justify-content: space-between;
    height: var(--top-bar-height);
    background: var(--background-semi-transparent);
    user-select: none;
    overflow-y: hidden;
    overflow-x: scroll;
    grid-column: 1 / span 3;
    display: flex;
    font-size: var(--font-size-small);
  }
</style>
