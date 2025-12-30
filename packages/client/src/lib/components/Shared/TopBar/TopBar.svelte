<script lang="ts">
  import { page } from "$app/state"
  import { goto } from "$app/navigation"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { phoneShowMenu } from "$lib/modules/ui/state.svelte"
  import { FEATURES } from "$lib/config/features"

  import PlayerInfo from "./PlayerInfo/PlayerInfo.svelte"
  import ModeSwitch from "./ModeSwitch.svelte"
  import OnlineUsers from "./OnlineUsers/OnlineUsers.svelte"

  import { Marquee, OperatorFeedButton, BackButton, ModeSwitchButton } from "$lib/components/Shared"

  const isAdminView = $derived(page.route?.id?.includes("/(main)/trip-lab") ?? false)
  const isOnOperatorFeed = $derived(page.url?.pathname === "/operator-feed")

  function handleHomeClick() {
    $phoneShowMenu = false
    goto("/")
  }
  function handleOperatorFeedClick() {
    $phoneShowMenu = false
    if (isOnOperatorFeed) {
      goto("/")
    } else {
      goto("/operator-feed")
    }
  }
  function handleTripLabClick() {
    $phoneShowMenu = false
    if (isAdminView) {
      goto("/")
    } else {
      goto("/trip-lab")
    }
  }
</script>

<div class="top-bar-wrapper">
  <!-- Phone layout: two rows -->
  <!-- <div class="phone-row phone-row-1">
    
  </div> -->
  <div class="phone-row phone-row-2">
    <PlayerInfo />
    {#if !$phoneShowMenu}
      <button
        class="phone-menu-toggle"
        data-tutorial="phone-menu-button"
        onclick={e => {
          e.stopPropagation()
          console.log("click")
          $phoneShowMenu = true
        }}
      >
        MENU
      </button>
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

<!-- Mobile menu: all options -->
{#if $phoneShowMenu}
  <div class="menu-mobile">
    <button onclick={handleHomeClick}> RAT & TRIPS </button>
    {#if FEATURES.ENABLE_OPERATOR_FEED}
      <div class="operator-feed-button-phone">
        <OperatorFeedButton
          isActive={false}
          tippyText={"Operator Feed"}
          onclick={handleOperatorFeedClick}
        />
        <ModeSwitchButton isAdminView={false} onclick={handleTripLabClick} />
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  .top-bar-wrapper {
    width: 100%;
    grid-column: 1 / span 3;
  }

  .phone-menu-toggle {
    width: 100%;
    height: 100%;
    color: var(--color-grey-light);
    background: var(--background);
    border: none;
    border-style: outset;
    border-width: 5px;
    border-color: var(--background-light-transparent);
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-large);
    font-family: var(--special-font-stack);
    line-height: 1em;
    z-index: 2;
    position: relative;
  }

  .menu-mobile {
    position: fixed;
    top: var(--top-bar-height-phone);
    left: 0;
    width: 100%;
    height: calc(var(--game-window-height) - var(--top-bar-height-phone));
    width: var(--game-window-width);
    background: black;
    grid-column: 1 / span 3;
    grid-row: 2 / span 1000;
    z-index: 99999;
    display: grid;
    grid-template-rows: repeat(3, 33.33%);

    button {
      border-style: outset;
      border-width: 30px;
    }

    * {
      font-size: 20px;
    }

    @media screen and (min-width: 800px) {
      display: none;
    }
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
