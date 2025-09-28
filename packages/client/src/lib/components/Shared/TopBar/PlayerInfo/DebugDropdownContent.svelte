<script lang="ts">
  import {
    player,
    playerAddress,
    playerERC20Allowance,
    playerERC20Balance,
    playerIsNew,
    playerIsBroke,
    tokenAllowanceApproved
  } from "$lib/modules/state/stores"
  import { playUISound } from "$lib/modules/sound/state.svelte"
  import {
    sendGiveCallerTokens,
    sendApproveMax,
    sendBuyWithEth
  } from "$lib/modules/action-manager/index.svelte"
  import { sendChatMessage } from "$lib/modules/off-chain-sync"
  import { SmallButton } from "$lib/components/Shared"
  import { getMixerState } from "$lib/modules/sound/state.svelte"
  import { ENTITY_TYPE } from "contracts/enums"
  import { walletType, environment } from "$lib/modules/network"
  import { busy } from "$lib/modules/action-manager/index.svelte"

  let mixer = getMixerState()

  const sendUnlockAdmin = async () => {
    await sendChatMessage("RatsRiseUp666")
  }
</script>

<div class="debug-dropdown-content">
  <div class="tab">
    <p class="key">Address:</p>
    <p class="value">
      {$playerAddress}
    </p>
  </div>
  <div class="tab">
    <p class="key">Environment</p>
    <p class="value">{$environment}</p>
  </div>
  <div class="tab">
    <p class="key">Wallet Type:</p>
    <p class="value">
      {$walletType}
    </p>
  </div>
  <div class="tab">
    <p class="key">Spawned:</p>
    <p class="value">
      {$player?.entityType == ENTITY_TYPE.PLAYER}
    </p>
  </div>
  <div class="tab">
    <p class="key">Tokens:</p>
    <p class="value">
      {$playerERC20Balance}
    </p>
  </div>
  <div class="tab">
    <p class="key">Allowance:</p>
    <p class="value">
      {$playerERC20Allowance}
    </p>
  </div>
  <div class="tab">
    <p class="key">Is new:</p>
    <p class="value">
      {$playerIsNew}
    </p>
  </div>
  <div class="tab">
    <p class="key">Is broke:</p>
    <p class="value">
      {$playerIsBroke}
    </p>
  </div>
  <div class="actions">
    <SmallButton
      disabled={busy.GiveCallerTokens.current !== 0}
      tippyText="Request tokens from the contract"
      onclick={async () => {
        await sendGiveCallerTokens()
        playUISound("ratfun", "coins")
      }}
      text="Get 2000 free $slopamine"
    ></SmallButton>
    <SmallButton
      disabled={busy.BuyWithEth.current !== 0}
      tippyText="Buy some $Slopamine"
      onclick={async () => {
        await sendBuyWithEth()
        playUISound("ratfun", "coins")
      }}
      text="Buy 1 $Slopamine for 0.001ETH"
    ></SmallButton>
    <SmallButton
      disabled={busy.ApproveMax.current !== 0 || $tokenAllowanceApproved}
      tippyText="Allow the contract to spend on your behalf"
      onclick={async () => {
        await sendApproveMax()
      }}
      text="Approve max allowance"
    ></SmallButton>
    <SmallButton
      tippyText="Unlock admin mode"
      onclick={async () => {
        await sendUnlockAdmin()
      }}
      disabled={$player?.masterKey}
      text="Unlock admin mode"
    ></SmallButton>
  </div>

  <div class="tab">
    <p class="key">UI Volume</p>
    <input
      min="-100"
      max="0"
      type="range"
      name="ui-volume"
      id="ui-volume"
      bind:value={mixer.channelStates.ui.volume}
      oninput={e => mixer.setChannelVolume("ui", Number(e.target.value))}
    />
    {mixer.channelStates.ui.volume}dB
    <label>
      <input
        type="checkbox"
        bind:checked={mixer.channelStates.ui.muted}
        onchange={e => mixer.setChannelMute("ui", e.target.checked)}
      />
      Mute
    </label>
  </div>
</div>

<style lang="scss">
  .debug-dropdown-content {
    .actions {
      display: flex;
      flex-flow: column nowrap;
      gap: 8px;
    }

    p {
      margin: 0;
    }

    .tab {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 8px;

      .key {
        width: 140px;
      }

      input[type="range"] {
        flex: 1;
        min-width: 100px;
      }

      label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: var(--font-size-normal);
      }
    }
  }
</style>
