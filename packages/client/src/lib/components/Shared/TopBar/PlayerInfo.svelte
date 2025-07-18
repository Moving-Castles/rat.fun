<script lang="ts">
  import { player, playerERC20Balance } from "$lib/modules/state/stores"
  import { NumberGoing } from "$lib/components/Shared"
  import { tippy } from "svelte-tippy"
  let balanceGoing = $state(false)
</script>

<div class="player-info">
  <!-- PLAYER STATS -->
  {#if $player}
    <div class="player-stats">
      <!-- NAME -->
      <div class="stat-item">
        <div
          use:tippy={{
            content: `This is you`,
            placement: "bottom"
          }}
          class="inner-wrapper player"
        >
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
            $<NumberGoing bind:going={balanceGoing} muted={true} value={$playerERC20Balance ?? 0} />
          </div>
        </div>
      </div>
      <!-- RATS KILLED -->
      {#if $player?.pastRats?.length > 0}
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

<style lang="scss">
  .player-info {
    .player-stats {
      display: flex;
      align-items: center;
      height: 100%;

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
          padding-inline: 20px;

          &.balance {
            background: var(--color-value);
            color: var(--black);
          }

          &.player {
            color: var(--foreground);
          }
        }
      }
    }
  }
</style>
