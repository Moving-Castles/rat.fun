<script lang="ts">
  import { player, playerAddress } from "$lib/modules/state/stores"
  import { playSound } from "$lib/modules/sound"
  import { Tooltip } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  import AccountDropdown from "./AccountDropdown.svelte"
  import BalanceBox from "./BalanceBox.svelte"

  let showAccountDropdown = $state(false)
  let dropdownElement = $state<HTMLElement | undefined>(undefined)
  let playerStatsElement = $state<HTMLElement | undefined>(undefined)

  function onmousedown() {
    if (showAccountDropdown) {
      playSound({ category: "ratfunUI", id: "dropDownUp" })
    } else {
      playSound({ category: "ratfunUI", id: "dropDownDown" })
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
  <button
    class="player-stats"
    bind:this={playerStatsElement}
    {onmousedown}
    onmouseup={toggleAccountStats}
  >
    <!-- NAME -->
    <div class="stat-item name">
      <!-- AVATAR -->
      <Tooltip content={UI_STRINGS.youIndication($playerAddress)}>
        <div class="inner-wrapper player">
          <div class="avatar">
            <img src="/images/pfp.png" alt={UI_STRINGS.you} draggable={false} />
          </div>
          <div class="value">{$player?.name ?? ""}</div>
        </div>
      </Tooltip>
    </div>
    <!-- BALANCE -->
    <BalanceBox />
  </button>
</div>

{#if showAccountDropdown}
  <div bind:this={dropdownElement}>
    <AccountDropdown />
  </div>
{/if}

<style lang="scss">
  .player-info {
    min-width: 200px;
    @media (max-width: 800px) {
      min-width: unset;
    }

    .player-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      width: 100%;
      cursor: pointer;
      border: 0;
      outline: 0;
      background: transparent;
      padding: 0;

      .stat-item {
        display: flex;
        height: 100%;
        line-height: var(--top-bar-height);
        border: 0;
        background: transparent;
        color: var(--foreground);
        padding: 8px;

        &.name {
          font-size: var(--font-size-small);
        }

        .inner-wrapper {
          display: inline-flex;
          padding-right: 10px;
          align-items: center;
          width: 100%;

          &.player {
            color: var(--foreground);
          }
        }
      }
    }

    .avatar {
      width: 40px;
      height: 40px;
      border: 1px solid var(--color-value);
      border-radius: 50%;
      margin-right: 10px;
      overflow: hidden;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }
</style>
