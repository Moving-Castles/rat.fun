<script lang="ts">
  import { player } from "@modules/state/base/stores"
  import HighScore from "@components/Main/HighScore/HighScore.svelte"
  import ModalTarget from "@components/Main/Modal/ModalTarget.svelte"
  import { tippy } from "svelte-tippy"

  let showHighscore = $state(false)
</script>

<div class="operator-bar">
  <div class="operator-track">
    <!-- PLAYER STATS -->
    {#if $player}
      <div class="player-stats">
        <!-- NAME -->
        <div class="stat-item">
          <div
            use:tippy={{
              content: `${$player.name}: This is you, an operator of the firm`,
              placement: "bottom",
            }}
            class="inner-wrapper operator"
          >
            <div class="label">Operator:</div>
            <div class="value">{$player.name}</div>
          </div>
        </div>
        <!-- BALANCE -->
        <div
          use:tippy={{
            content: `This is available funds in your operator wallet, spend wisely`,
            placement: "bottom",
          }}
          class="stat-item"
        >
          <div class="inner-wrapper balance">
            <div class="label">Balance:</div>
            <div class="value">${$player?.balance ?? 0}</div>
          </div>
        </div>
        <!-- HIGHSCORE -->
        <button
          class="stat-item highscore"
          onclick={() => (showHighscore = true)}
        >
          <div class="inner-wrapper">
            <div class="label">HighScore</div>
          </div>
        </button>
      </div>
    {/if}
  </div>
</div>

{#snippet content()}
  <HighScore />
{/snippet}

{#if showHighscore}
  <ModalTarget onclose={() => (showHighscore = false)} {content} />
{/if}

<style lang="scss">
  .operator-bar {
    width: 100%;
    max-width: 100%;
    border-bottom: var(--default-border-style);
    display: flex;
    justify-content: space-between;
    height: var(--operator-bar-height);
    background: var(--black);
    user-select: none;
    overflow-y: hidden;
    overflow-x: scroll;

    .operator-track {
      width: 100%;
    }

    .player-stats {
      display: flex;
      align-items: center;
      height: 100%;

      .stat-item {
        display: flex;
        height: 100%;
        line-height: var(--operator-bar-height);
        border: 0;
        background: transparent;
        border-right: var(--default-border-style);
        color: var(--foreground);

        .label {
          margin-right: 0.5em;
        }

        &.highscore {
          font-size: var(--font-size-small);

          &:hover {
            background: var(--color-grey-mid);
          }
        }

        .inner-wrapper {
          display: inline-flex;
          padding-inline: 20px;

          &.balance {
            background: var(--color-value);
            color: var(--black);
          }

          &.operator {
            color: var(--foreground);
          }
        }
      }
    }
  }
</style>
