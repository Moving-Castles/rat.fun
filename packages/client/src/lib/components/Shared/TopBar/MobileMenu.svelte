<script lang="ts">
  import { page } from "$app/state"
  import { goto } from "$app/navigation"
  import { phoneShowMenu } from "$lib/modules/ui/state.svelte"
  import { FEATURES } from "$lib/config/features"
  import { OperatorFeedButton, ModeSwitchButton } from "$lib/components/Shared"

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

{#if $phoneShowMenu}
  <div class="menu-mobile">
    <button class="home-button" onclick={handleHomeClick}> RAT & TRIPS </button>
    {#if FEATURES.ENABLE_OPERATOR_FEED}
      <div class="operator-feed-button-phone">
        <OperatorFeedButton
          isActive={false}
          tippyText={"Operator Feed"}
          onclick={handleOperatorFeedClick}
        />
      </div>
    {/if}
    <ModeSwitchButton isAdminView={false} onclick={handleTripLabClick} />
  </div>
{/if}

<style lang="scss">
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

    @media screen and (min-width: 800px) {
      display: none;
    }
  }

  .home-button {
    width: 100%;
    height: 100%;
    background: var(--color-grey-light);
    color: var(--color-grey-darker);
    border: none;
    border-style: outset;
    border-width: 30px;
    border-color: var(--background-light-transparent);
    font-size: var(--font-size-large);
    font-family: var(--special-font-stack);
    cursor: pointer;

    &:hover {
      background: var(--color-grey-lighter);
    }

    &:active {
      border-style: inset;
      transform: translateY(2px);
    }
  }
</style>
