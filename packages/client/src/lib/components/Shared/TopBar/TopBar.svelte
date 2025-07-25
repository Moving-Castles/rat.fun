<script lang="ts">
  import { player, worldStats, worldEvent, activeWorldEvent } from "$lib/modules/state/stores"
  import { staticContent, upcomingWorldEvent } from "$lib/modules/content"
  import { notificationsRead } from "$lib/modules/ui/stores"

  import OperatorInfo from "./PlayerInfo.svelte"
  import PaneSwitch from "./PaneSwitch.svelte"
  import WorldEvent from "./WorldEvent.svelte"
  import WorldEventCountdown from "./WorldEventCountdown.svelte"
  import GlobalStats from "./GlobalStats.svelte"
</script>

<div class="top-bar">
  <OperatorInfo />
  <div class="right">
    {#if $worldStats}
      <GlobalStats />
    {/if}
    {#if $activeWorldEvent}
      <WorldEvent />
    {:else if $upcomingWorldEvent}
      <WorldEventCountdown />
    {/if}
    {#if $player?.masterKey}
      <PaneSwitch />
    {/if}
  </div>
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

  .right {
    display: flex;
  }
</style>
