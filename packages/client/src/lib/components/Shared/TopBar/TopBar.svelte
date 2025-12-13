<script lang="ts">
  import { page } from "$app/state"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  import PlayerInfo from "./PlayerInfo/PlayerInfo.svelte"
  import ModeSwitch from "./ModeSwitch.svelte"
  import OnlineUsers from "./OnlineUsers/OnlineUsers.svelte"

  import { Marquee } from "$lib/components/Shared"

  const isAdminView = $derived(page.route?.id?.includes("/(main)/trips-lab") ?? false)
</script>

<div class="top-bar">
  <PlayerInfo />
  <div class="marquee-container">
    <Marquee numberOfCopies={3} direction="left">
      <p class="text">{UI_STRINGS.topBarMarqueeText}</p>
    </Marquee>
  </div>
  <div class="right">
    <OnlineUsers />
    <ModeSwitch {isAdminView} />
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
    flex-shrink: 0;
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

      .right {
        flex: 1;
      }
    }
  }
</style>
