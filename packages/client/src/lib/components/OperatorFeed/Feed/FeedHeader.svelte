<script lang="ts">
  import { fade } from "svelte/transition"
  import { Checkbox } from "$lib/components/Shared"
  import { activeFilters, setFilter } from "../state.svelte"
  import { FEED_MESSAGE_TYPE } from "./types"
  import { onlinePlayers, websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { playSound } from "$lib/modules/sound"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  const filterOptions = [
    { type: FEED_MESSAGE_TYPE.CHAT, label: "Chat" },
    { type: FEED_MESSAGE_TYPE.NEW_TRIP, label: "Trips" },
    { type: FEED_MESSAGE_TYPE.NEW_OUTCOME, label: "Outcomes" },
    { type: FEED_MESSAGE_TYPE.TRIP_LIQUIDATED, label: "Liquidated" }
  ] as const

  function handleChange(type: FEED_MESSAGE_TYPE, checked: boolean) {
    setFilter(type, checked)
  }

  // Online users dropdown
  let showDropdown = $state(false)
  let dropdownElement = $state<HTMLElement | undefined>(undefined)
  let buttonElement = $state<HTMLElement | undefined>(undefined)

  const onlineCount = $derived($onlinePlayers.length)

  function handleOnlineClick() {
    playSound({ category: "ratfunUI", id: "click" })
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

<div class="feed-header">
  <span class="title">Feed</span>
  <div class="filters">
    {#each filterOptions as option}
      <label class="filter-item">
        <Checkbox
          checked={$activeFilters.has(option.type)}
          onchange={() => handleChange(option.type, !$activeFilters.has(option.type))}
        />
        <span class="label" class:active={$activeFilters.has(option.type)}>{option.label}</span>
      </label>
    {/each}
  </div>
  <div class="online-users">
    <button
      class="online-button"
      class:connected={$websocketConnected}
      class:active={showDropdown}
      bind:this={buttonElement}
      onclick={handleOnlineClick}
    >
      <span class="indicator" class:connected={$websocketConnected}></span>
      <span class="count">{onlineCount}</span>
    </button>
    {#if showDropdown}
      <div class="online-dropdown" bind:this={dropdownElement} out:fade={{ duration: 200 }}>
        <div class="dropdown-header">{UI_STRINGS.onlinePlayersCount(onlineCount)}</div>
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
  </div>
</div>

<style lang="scss">
  .feed-header {
    display: flex;
    align-items: center;
    border-bottom: var(--default-border-style);
    background: var(--background);
    position: sticky;
    top: 0;
    z-index: var(--z-high);

    @media (max-width: 800px) {
      display: none;
    }
  }

  .title {
    width: 80px;
    flex-shrink: 0;
    padding: 12px 16px;
    font-family: var(--special-font-stack);
    font-size: var(--font-size-normal);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-right: var(--default-border-style);

    @media (max-width: 800px) {
      width: 60px;
      padding: 8px 12px;
    }
  }

  .filters {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    flex-wrap: wrap;

    @media (max-width: 800px) {
      gap: 8px;
      padding: 8px 12px;
    }
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: var(--font-size-small);
    user-select: none;

    .label {
      opacity: 0.7;
      transition: opacity 0.15s ease;

      &.active {
        opacity: 1;
      }
    }

    &:hover .label {
      opacity: 1;
    }
  }

  .online-users {
    width: 80px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: var(--default-border-style);
    align-self: stretch;
    position: relative;

    @media (max-width: 800px) {
      width: 60px;
    }

    .online-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      height: 100%;
      background: transparent;
      border: none;
      color: var(--foreground);
      cursor: pointer;
      font-size: var(--font-size-small);

      &:hover {
        background: var(--color-grey-darker);
      }

      &.active {
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
    position: absolute;
    top: 100%;
    user-select: none;
    right: 0;
    background-color: var(--background-dark-transparent);
    color: var(--white);
    padding: 10px;
    padding-bottom: 0;
    line-height: 1.3em;
    z-index: 2000;
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    font-size: var(--font-size-small);
    font-family: var(--special-font-stack);
    border: 1px solid var(--color-border);
    min-width: 200px;
    max-width: 300px;
    max-height: 300px;
    overflow-y: auto;

    .dropdown-header {
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
