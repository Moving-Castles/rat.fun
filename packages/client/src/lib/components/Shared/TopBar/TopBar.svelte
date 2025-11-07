<script lang="ts">
  import { page } from "$app/state"
  import { player, activeWorldEvent } from "$lib/modules/state/stores"
  import { upcomingWorldEvent } from "$lib/modules/content"

  import PlayerInfo from "./PlayerInfo/PlayerInfo.svelte"
  import ModeSwitch from "./ModeSwitch.svelte"
  import WorldEvent from "./WorldEvent.svelte"
  import WorldEventCountdown from "./WorldEventCountdown.svelte"

  import { Marquee } from "$lib/components/Shared"

  const isAdminView = $derived(page.route?.id?.includes("/(main)/cashboard") ?? false)
</script>

<div class="top-bar">
  <PlayerInfo />
  <div class="marquee-container">
    <Marquee numberOfCopies={3} direction="left">
      <p class="text">THERE IS NO LUCK. ONLY SKILL. THERE ARE NO BAD TRIPS, ONLY BAD RATS.</p>
    </Marquee>
  </div>
  <div class="right">
    {#if $activeWorldEvent}
      <WorldEvent />
    {:else if $upcomingWorldEvent}
      <WorldEventCountdown />
    {/if}
    {#if $player?.masterKey}
      <ModeSwitch {isAdminView} />
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

    .marquee-container {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      position: relative;
      width: 100px;
      height: 100%;
      opacity: 0.2;
      font-size: var(--font-size-large);
      text-transform: uppercase;

      .text {
        height: var(--top-bar-height);
        line-height: var(--top-bar-height);
        margin: 0;
        padding: 0;
      }
    }

    .right {
      display: flex;
    }

    @media (max-width: 800px) {
      // Hide marquee on phone
      .marquee-container {
        display: none;
      }
    }
  }
</style>
