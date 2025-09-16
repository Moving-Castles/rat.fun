<script lang="ts">
  import { playerAddress } from "$lib/modules/state/stores"
  import { onMount, onDestroy } from "svelte"
  import { playerERC20Allowance, playerERC20Balance } from "$lib/modules/state/stores"
  import { playUISound } from "$lib/modules/sound"
  import {
    sendGiveCallerTokens,
    sendApproveMax,
    sendBuyWithEth
  } from "$lib/modules/action-manager/index.svelte"
  import { SmallButton } from "$lib/components/Shared"
  import { getMixerState } from "$lib/modules/sound/state.svelte"
  import { ENTITY_TYPE } from "contracts/enums"
  import { walletType, environment } from "$lib/modules/network"
  import { player } from "$lib/modules/state/stores"
  import { busy } from "$lib/modules/action-manager/index.svelte"

  const mixer = getMixerState()

  let showJazz = $state(false)

  const solo = () => {
    if (mixer?.players?.mainSolo) {
      mixer?.stopMusic("mainSolo")
      mixer?.players.mainSolo.start()
    }
  }

  const playNote = (semitones: number) => {
    mixer?.setPitchShift("mainSolo", semitones)
    solo()
  }

  onMount(() => {
    playUISound("ratfun", "textLineHit")
  })

  onDestroy(() => {
    playUISound("ratfun", "textLineHit")
  })
</script>

<div class="account-stats">
  <div class="tab">
    <p class="key">Your address:</p>
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
  <div class="actions">
    <SmallButton
      disabled={busy.GiveCallerTokens.current !== 0}
      tippyText="Request tokens from the contract"
      extraClass="red"
      onclick={async () => {
        await sendGiveCallerTokens()
        playUISound("ratfun", "coins")
      }}
      text="Get 2000 free $SLopamine"
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
      disabled={busy.ApproveMax.current !== 0}
      tippyText="Allow the contract to spend on your behalf"
      onclick={async () => {
        await sendApproveMax()
      }}
      text="Approve max allowance"
    ></SmallButton>
  </div>

  <div class="tab">
    {#if showJazz}
      <div class="piano-keys">
        <button class="white-key" onclick={() => playNote(-12)}></button>
        <button class="black-key" onclick={() => playNote(-9)}></button>
        <button class="white-key" onclick={() => playNote(-6)}></button>
        <button class="black-key" onclick={() => playNote(-3)}></button>
        <button class="white-key" onclick={() => playNote(0)}></button>
        <button class="white-key" onclick={() => playNote(1)}></button>
        <button class="black-key" onclick={() => playNote(2)}></button>
        <button class="white-key" onclick={() => playNote(7)}></button>
        <button class="black-key" onclick={() => playNote(3)}></button>
        <button class="white-key" onclick={() => playNote(4)}></button>
        <button class="black-key" onclick={() => playNote(6)}></button>
        <button class="white-key" onclick={() => playNote(12)}></button>
      </div>
    {/if}
    <p class="key">Music volume</p>
    <input
      min="-100"
      max="0"
      type="range"
      name="music-volume"
      id="music-volume"
      value={mixer.channelStates.music.volume}
      oninput={e => {
        mixer.setChannelVolume("music", Number(e.target.value))
      }}
    />
    {mixer.channelStates.music.volume}dB
    <label>
      <input
        type="checkbox"
        bind:checked={mixer.channelStates.music.muted}
        onchange={e => mixer.setChannelMute("music", e.target.checked)}
      />
      Mute
    </label>
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

<svelte:window onkeydown={() => (showJazz = true)} onkeyup={() => (showJazz = false)} />

<style lang="scss">
  .account-stats {
    position: fixed;
    top: 68px;
    left: 8px;
    background-color: var(--background-semi-transparent);
    color: var(--white);
    padding: 20px;
    transition: all 0.2s ease;
    line-height: 1.3em;
    z-index: 1;
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    font-size: 20px;
    font-family: var(--special-font-stack);
    z-index: 99;
    border: 1px solid var(--color-border);

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
      gap: 8px;

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
        font-size: 16px;
      }
    }

    .piano-keys {
      width: 300px;
      height: 60px;
      position: relative;
      display: flex;
      margin-bottom: 8px;

      .white-key {
        width: calc(300px / 7);
        height: 60px;
        background: white;
        border: none;
        cursor: pointer;
        border-style: outset;
        border-width: 4px;
        border-color: rgba(0, 0, 0, 0.2);

        &:hover {
          background: #f0f0f0;
        }
      }

      .black-key {
        width: calc(300px / 14);
        height: 24px;
        background: black;
        border: none;
        position: absolute;
        cursor: pointer;
        border-style: outset;
        border-width: 4px;
        border-color: rgba(0, 0, 0, 0.2);

        &:hover {
          background: #333;
        }

        &:nth-of-type(2) {
          left: calc(300px / 7 - 300px / 28);
        }
        &:nth-of-type(4) {
          left: calc(300px / 7 * 2 - 300px / 28);
        }
        &:nth-of-type(7) {
          left: calc(300px / 7 * 4 - 300px / 28);
        }
        &:nth-of-type(9) {
          left: calc(300px / 7 * 5 - 300px / 28);
        }
        &:nth-of-type(11) {
          left: calc(300px / 7 * 6 - 300px / 28);
        }
      }
    }

    .group-controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      button {
        padding: 4px 8px;
        font-size: 14px;
        background: var(--color-border);
        color: var(--white);
        border: 1px solid var(--color-border);
        cursor: pointer;

        &:hover {
          background: var(--white);
          color: var(--background-semi-transparent);
        }
      }
    }
  }
</style>
