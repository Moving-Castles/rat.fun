<script lang="ts">
  import { playerAddress, player } from "$lib/modules/state/stores"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { shortenAddress } from "$lib/modules/utils"
  import { getDrawbridge } from "$lib/modules/drawbridge"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { saleStatus } from "$lib/modules/network"
  import { SALE_STATUS } from "@ratfun/common/basic-network"
  import { SmallButton, Checkbox } from "$lib/components/Shared"
  import { musicEnabled, backgroundMusic } from "$lib/modules/sound/stores"
  import {
    playerNotificationsEnabled,
    tripNotificationsEnabled
  } from "$lib/modules/ui/notification-settings"
  import { toastManager, TOAST_TYPE } from "$lib/modules/ui/toasts.svelte"
  import { openAllowanceModal } from "$lib/modules/ui/allowance-modal.svelte"

  const toggleMusic = () => {
    musicEnabled.current = !musicEnabled.current
    if (!musicEnabled.current) {
      backgroundMusic.stop()
    } else {
      backgroundMusic.resume()
    }
  }

  const togglePlayerNotifications = () => {
    playerNotificationsEnabled.current = !playerNotificationsEnabled.current
    if (!playerNotificationsEnabled.current) {
      toastManager.removeByType(TOAST_TYPE.PLAYER_NOTIFICATION)
    }
  }

  const toggleTripNotifications = () => {
    tripNotificationsEnabled.current = !tripNotificationsEnabled.current
    if (!tripNotificationsEnabled.current) {
      toastManager.removeByType(TOAST_TYPE.TRIP_NOTIFICATION)
    }
  }

  const pastRatsCount = $derived(($player?.pastRats ?? []).length)

  const goToSale = () => {
    window.open("https://sale.rat.fun", "_blank")
  }
</script>

<div class="main-dropdown-content">
  <!-- Name -->
  <div class="row">
    <span class="label">{UI_STRINGS.name}</span>
    <span class="value">{$player?.name ?? ""}</span>
  </div>

  <!-- Wallet Address -->
  <div class="row">
    <span class="label">{UI_STRINGS.connectedWallet}</span>
    <span class="value">{shortenAddress($playerAddress)}</span>
  </div>

  <!-- Disconnect Wallet Button -->
  <div class="row button-row">
    <SmallButton
      tippyText={UI_STRINGS.disconnectWallet}
      onclick={async () => {
        await getDrawbridge().disconnectWallet()
        UIState.set(UI.SPAWNING)
      }}
      text={UI_STRINGS.disconnectWallet}
    />
  </div>

  <!-- Rats Killed Section (conditional) -->
  {#if pastRatsCount > 0}
    <div class="divider"></div>
    <div class="row">
      <span class="label">{UI_STRINGS.ratAmountKilled}</span>
      <span class="value">{pastRatsCount}</span>
    </div>
  {/if}

  <div class="divider"></div>

  <!-- Balance -->
  <div class="row">
    <span class="label">{UI_STRINGS.balance}</span>
    <span class="value">{$playerERC20Balance} {CURRENCY_SYMBOL}</span>
  </div>

  <!-- Buy $RAT Button (placeholder, only if sale is live) -->
  {#if $saleStatus === SALE_STATUS.LIVE}
    <div class="row button-row">
      <SmallButton tippyText="Buy $RAT" onclick={goToSale} text="Buy $RAT" />
    </div>
  {/if}

  <!-- Manage Allowance Button -->
  <div class="row button-row">
    <SmallButton
      tippyText={UI_STRINGS.manageAllowance}
      onclick={() => openAllowanceModal()}
      text={UI_STRINGS.manageAllowance}
    />
  </div>

  <div class="divider"></div>

  <!-- Music Toggle -->
  <div class="row toggle-row">
    <span class="label">{UI_STRINGS.music}</span>
    <Checkbox checked={musicEnabled.current} onchange={toggleMusic} />
  </div>

  <!-- Player Notification Toggle -->
  <div class="row toggle-row">
    <span class="label">{UI_STRINGS.playerNotifications}</span>
    <Checkbox checked={playerNotificationsEnabled.current} onchange={togglePlayerNotifications} />
  </div>

  <!-- Trip Notification Toggle -->
  <div class="row toggle-row">
    <span class="label">{UI_STRINGS.tripNotifications}</span>
    <Checkbox checked={tripNotificationsEnabled.current} onchange={toggleTripNotifications} />
  </div>
</div>

<style lang="scss">
  .main-dropdown-content {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .row {
      display: flex;
      align-items: center;
      gap: 8px;

      &.button-row {
        height: 40px;
      }

      .label {
        font-family: var(--typewriter-font-stack);
        min-width: 180px;
      }

      .value {
        font-family: var(--special-font-stack);
      }
    }

    .toggle-row {
      justify-content: space-between;
    }

    .divider {
      height: 1px;
      background: var(--color-border);
      margin: 4px 0;
    }
  }
</style>
