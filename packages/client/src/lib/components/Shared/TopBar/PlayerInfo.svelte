<script lang="ts">
  import { player, playerERC20Balance } from "$lib/modules/state/stores"
  import { NumberGoing } from "$lib/components/Shared"
  import { tippy } from "svelte-tippy"
  import AccountStats from "./AccountStats.svelte"

  let { isAdminView }: { isAdminView: boolean } = $props()

  let balanceGoing = $state(false)
  let showAccountStats = $state(false)
</script>

<div class="player-info">
  <!-- PLAYER STATS -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  {#if $player}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="player-stats" onclick={() => (showAccountStats = !showAccountStats)}>
      <!-- NAME -->
      <div class="stat-item">
        <!-- AVATAR -->
        <div
          use:tippy={{
            content: `This is you`,
            placement: "bottom"
          }}
          class="inner-wrapper player"
        >
          <div class="avatar"></div>
          <div class="value">{$player.name}</div>
        </div>
      </div>
      <!-- BALANCE -->
      <div
        use:tippy={{
          content: `This is available tokens in your wallet`,
          placement: "bottom"
        }}
        class="stat-item"
      >
        <div class:priority={balanceGoing} class="inner-wrapper balance">
          <div class="value">
            <span class="unit">SLOPAMINE</span>
            <NumberGoing bind:going={balanceGoing} muted={true} value={$playerERC20Balance ?? 0} />
          </div>
        </div>
      </div>
      <!-- RATS KILLED -->
      {#if isAdminView && $player?.pastRats?.length > 0}
        <div class="stat-item rats-killed">
          <div class="inner-wrapper">
            <div class="label">Rats killed:</div>
            <div class="value">{$player.pastRats.length}</div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

{#if showAccountStats}
  <AccountStats close={() => (showAccountStats = false)} />
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

        &.rats-killed {
          font-size: var(--font-size-small);
          color: var(--color-death);
        }

        .label {
          margin-right: 0.5em;
        }

        .inner-wrapper {
          display: inline-flex;
          padding-inline: 10px;
          align-items: center;

          &.balance {
            background: var(--color-value);
            color: var(--black);

            .value {
              position: relative;
              font-size: var(--font-size-large);
              top: 4px;
            }
          }

          &.player {
            color: var(--foreground);
          }
        }
      }
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: var(--color-value);
      border-radius: 50%;
      margin-right: 10px;
    }
  }

  .unit {
    font-size: var(--font-size-small);
    background: black;
    padding: 5px;
    color: white;
  }
</style>
