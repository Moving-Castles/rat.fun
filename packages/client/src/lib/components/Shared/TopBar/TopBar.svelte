<script lang="ts">
  import { page } from "$app/state"
  import {
    player,
    worldStats,
    activeWorldEvent,
    activeWorldEventContent
  } from "$lib/modules/state/stores"
  import { upcomingWorldEvent } from "$lib/modules/content"

  import PlayerInfo from "./PlayerInfo.svelte"
  import PaneSwitch from "./PaneSwitch.svelte"
  import WorldEvent from "./WorldEvent.svelte"
  import WorldEventCountdown from "./WorldEventCountdown.svelte"
  import GlobalStats from "./GlobalStats.svelte"

  const isAdminView = $derived(page.route?.id?.includes("/(rooms)/admin") ?? false)
  $inspect($activeWorldEventContent)
</script>

<div class="top-bar">
  <PlayerInfo {isAdminView} />
  <div class="right">
    {#if isAdminView && $worldStats}
      <GlobalStats />
    {/if}
    {#if $activeWorldEvent}
      <WorldEvent />
    {:else if $upcomingWorldEvent}
      <WorldEventCountdown />
    {/if}
    {#if $player?.masterKey}
      <PaneSwitch {isAdminView} />
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
