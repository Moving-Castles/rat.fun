<script lang="ts">
  import { playSound } from "$lib/modules/sound"

  import AccountDropdown from "./AccountDropdown.svelte"
  import OperatorAvatar from "./OperatorAvatar.svelte"
  import OperatorName from "./OperatorName.svelte"
  import BalanceBox from "./BalanceBox.svelte"
  import { phoneShowMenu } from "$lib/modules/ui/state.svelte"

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
    $phoneShowMenu = false
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
  <button
    class="player-stats"
    bind:this={playerStatsElement}
    {onmousedown}
    onmouseup={toggleAccountStats}
  >
    <OperatorAvatar />
    <OperatorName />
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
      align-items: center;
      height: 100%;
      width: 100%;
      cursor: pointer;
      border: 0;
      outline: 0;
      background: transparent;
      padding: 0;
    }
  }
</style>
