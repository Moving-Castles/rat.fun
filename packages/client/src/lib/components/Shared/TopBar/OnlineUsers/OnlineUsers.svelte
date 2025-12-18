<script lang="ts">
  import { fade } from "svelte/transition"
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { FEATURES } from "$lib/config/features"
  import { onlinePlayers, websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { playSound } from "$lib/modules/sound"
  import { Tooltip, OperatorFeedButton } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  // Operator Feed mode
  const isOnOperatorFeed = $derived($page.url.pathname === "/operator-feed")

  function handleOperatorFeedClick() {
    if (isOnOperatorFeed) {
      goto("/")
    } else {
      goto("/operator-feed")
    }
  }

  // Online Players mode
  let showDropdown = $state(false)
  let dropdownElement = $state<HTMLElement | undefined>(undefined)
  let buttonElement = $state<HTMLElement | undefined>(undefined)

  const onlineCount = $derived($onlinePlayers.length)

  function onmousedown() {
    if (showDropdown) {
      playSound({ category: "ratfunUI", id: "dropDownUp" })
    } else {
      playSound({ category: "ratfunUI", id: "dropDownDown" })
    }
  }

  function toggleDropdown() {
    showDropdown = !showDropdown
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node
    const isClickOnDropdown = dropdownElement && dropdownElement.contains(target)
    const isClickOnButton = buttonElement && buttonElement.contains(target)

    if (!isClickOnDropdown && !isClickOnButton) {
      showDropdown = false
    }
  }

  $effect(() => {
    if (showDropdown) {
      document.addEventListener("click", handleClickOutside)
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("click", handleClickOutside)
      document.removeEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  })
</script>

{#if FEATURES.ENABLE_OPERATOR_FEED}
  <div class="operator-feed-button">
    <OperatorFeedButton
      isActive={isOnOperatorFeed}
      tippyText={isOnOperatorFeed ? "Back to game" : "Operator Feed"}
      onclick={handleOperatorFeedClick}
    />
  </div>
{:else}
  <div class="online-users">
    <Tooltip content={$websocketConnected ? UI_STRINGS.onlinePlayers : UI_STRINGS.connecting}>
      <button
        class="online-button"
        class:connected={$websocketConnected}
        bind:this={buttonElement}
        {onmousedown}
        onmouseup={toggleDropdown}
      >
        <span class="indicator" class:connected={$websocketConnected}></span>
        <span class="count">ONLINE</span>
      </button>
    </Tooltip>
  </div>

  {#if showDropdown}
    <div class="online-dropdown" bind:this={dropdownElement} out:fade={{ duration: 200 }}>
      <div class="header">{UI_STRINGS.onlinePlayersCount(onlineCount)}</div>
      {#if $onlinePlayers.length === 0}
        <div class="empty">{UI_STRINGS.noPlayersOnline}</div>
      {:else}
        <ul class="player-list">
          {#each $onlinePlayers as player (player.id)}
            <li class="player-item">{player.name}</li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
{/if}

<style lang="scss">
  .operator-feed-button {
    width: 160px;
    height: 100%;

    @media (max-width: 800px) {
      display: none;
    }
  }

  .online-users {
    display: flex;
    align-items: center;
    height: 100%;
    border-left: var(--default-border-style);

    @media (max-width: 800px) {
      display: none;
    }

    .online-button {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 100%;
      padding: 0 12px;
      background: transparent;
      border: none;
      color: var(--foreground);
      cursor: pointer;
      font-size: var(--font-size-normal);

      &:hover {
        background: var(--color-grey-darker);
      }

      .indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-down);
        transition: background 0.2s ease;

        &.connected {
          background: var(--color-up);
        }
      }

      .count {
        min-width: 16px;
        text-align: center;
      }
    }
  }

  .online-dropdown {
    position: fixed;
    top: 58px;
    right: 160px;
    background-color: var(--background-dark-transparent);
    color: var(--white);
    padding: 12px;
    transition: all 0.2s ease;
    line-height: 1.3em;
    z-index: 2000;
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    font-size: var(--font-size-normal);
    font-family: var(--special-font-stack);
    border: 1px solid var(--color-border);
    min-width: 200px;
    max-width: 300px;
    max-height: 400px;
    overflow-y: auto;

    @media (max-width: 800px) {
      right: 0;
      min-width: 180px;
    }

    .header {
      padding-bottom: 8px;
      border-bottom: 1px solid var(--color-border);
    }

    .empty {
      opacity: 0.5;
    }

    .player-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .player-item {
        padding: 4px 0;
        border-bottom: 1px solid var(--color-border);
        opacity: 0.9;

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }
</style>
