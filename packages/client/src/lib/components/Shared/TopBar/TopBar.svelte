<script lang="ts">
  import { page } from "$app/state"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { phoneShowMenu } from "$lib/modules/ui/state.svelte"

  import PlayerInfo from "./PlayerInfo/PlayerInfo.svelte"
  import ModeSwitch from "./ModeSwitch.svelte"
  import OnlineUsers from "./OnlineUsers/OnlineUsers.svelte"
  import MobileMenu from "./MobileMenu.svelte"
  import PhoneMenuButton from "./PhoneMenuButton.svelte"

  import { Marquee, BackButton } from "$lib/components/Shared"

  const isAdminView = $derived(page.route?.id?.includes("/(main)/trip-lab") ?? false)
</script>

<div class="top-bar-wrapper">
  <!-- Phone layout: two rows -->
  <!-- <div class="phone-row phone-row-1">
    
  </div> -->
  <div class="phone-row phone-row-2">
    <PlayerInfo />
    {#if !$phoneShowMenu}
      <PhoneMenuButton
        text="MENU"
        onclick={e => {
          e.stopPropagation()
          $phoneShowMenu = true
        }}
      />
    {:else}
      <BackButton
        small={true}
        onclick={e => {
          e.stopPropagation()
          console.log("click back")
          $phoneShowMenu = false
        }}
      />
    {/if}
  </div>

  <!-- Desktop layout: single row -->
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
</div>

<MobileMenu />

<style lang="scss">
  .top-bar-wrapper {
    width: 100%;
    grid-column: 1 / span 3;
  }

  // Phone rows - hidden on desktop
  .phone-row {
    display: none;
    width: 100%;
    height: var(--top-bar-height-phone);
    min-height: var(--top-bar-height-phone);
    flex-shrink: 0;
    background: var(--background-semi-transparent);
    user-select: none;
    font-size: var(--font-size-small);

    @media (max-width: 800px) {
      display: flex;
    }
  }

  .phone-row-2 {
    border-bottom: var(--default-border-style);
  }

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
    font-size: var(--font-size-small);

    // Hide desktop layout on phone
    @media (max-width: 800px) {
      display: none;
    }

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
  }
</style>
