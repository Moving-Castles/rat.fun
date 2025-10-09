<script lang="ts">
  import { player, playerAddress } from "$lib/modules/state/stores"
  import { playSound } from "$lib/modules/sound"
  import { tippy } from "svelte-tippy"

  import AccountDropdown from "./AccountDropdown.svelte"
  import BalanceBox from "./BalanceBox.svelte"

  let showAccountDropdown = $state(false)
  let dropdownElement = $state<HTMLElement | undefined>(undefined)
  let playerStatsElement = $state<HTMLElement | undefined>(undefined)

  function onmousedown() {
    if (showAccountDropdown) {
      playSound("ratfunUI", "dropDownUp")
    } else {
      playSound("ratfunUI", "dropDownDown")
    }
  }

  function toggleAccountStats() {
    showAccountDropdown = !showAccountDropdown
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node
    const isClickOnDropdown = dropdownElement && dropdownElement.contains(target)
    const isClickOnPlayerStats = playerStatsElement && playerStatsElement.contains(target)

    if (!isClickOnDropdown && !isClickOnPlayerStats) {
      showAccountDropdown = false
    }
  }

  // Add/remove click listener when dropdown state changes
  $effect(() => {
    if (showAccountDropdown) {
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

<div class="player-info">
  <!-- PLAYER STATS -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="player-stats"
    bind:this={playerStatsElement}
    {onmousedown}
    onmouseup={toggleAccountStats}
  >
    <!-- NAME -->
    <div class="stat-item name">
      <!-- AVATAR -->
      <div
        use:tippy={{
          content: `This is you: ${$playerAddress}`,
          placement: "bottom"
        }}
        class="inner-wrapper player"
      >
        <div class="avatar"></div>
        <div class="value">{$player.name}</div>
      </div>
    </div>
    <!-- BALANCE -->
    <BalanceBox />
  </div>
</div>

{#if showAccountDropdown}
  <div bind:this={dropdownElement}>
    <AccountDropdown />
  </div>
{/if}

<style lang="scss">
  .player-info {
    .player-stats {
      display: flex;
      align-items: center;
      height: 100%;
      cursor: pointer;

      .stat-item {
        display: flex;
        height: 100%;
        line-height: var(--top-bar-height);
        border: 0;
        background: transparent;
        border-right: var(--default-border-style);
        color: var(--foreground);

        &.name {
          font-size: var(--font-size-small);
        }

        .inner-wrapper {
          display: inline-flex;
          padding-inline: 10px;
          align-items: center;
          width: 100%;

          &.player {
            color: var(--foreground);
          }
        }
      }
    }

    .avatar {
      width: 30px;
      height: 30px;
      background: var(--color-value);
      border-radius: 50%;
      margin-right: 5px;
    }
  }
</style>
