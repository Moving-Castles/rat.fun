<script lang="ts">
  import { player } from "$lib/modules/state/base/stores"
  import OperatorInfo from "./PlayerInfo.svelte"
  import PaneSwitch from "./PaneSwitch.svelte"
  import { activeWorldEvent } from "$lib/modules/state/base/stores"
  import WorldEvent from "./WorldEvent.svelte"
</script>

<div class="top-bar">
  <OperatorInfo />
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
    background: var(--black);
    user-select: none;
    overflow-y: hidden;
    overflow-x: scroll;
    grid-column: 1 / span 3;
    display: flex;
  }
</style>
