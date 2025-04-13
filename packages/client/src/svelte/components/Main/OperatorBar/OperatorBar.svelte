<script lang="ts">
  import { player } from "@modules/state/base/stores"
  import { HighScoreModalActive } from "@modules/ui/stores"
  import { tippy } from "svelte-tippy"
  import Alert from "@components/Main/OperatorBar/Alert/Alert.svelte"
</script>

<div class="operator-bar">
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
        onclick={() => HighScoreModalActive.set(true)}
      >
        <div class="inner-wrapper">
          <div class="label">HighScore</div>
        </div>
      </button>
    </div>
  {/if}
  <div class="alert-container">
    <Alert />
  </div>
</div>

<style lang="scss">
  .operator-bar {
    width: 100%;
    border-bottom: 1px solid white;
    display: flex;
    justify-content: space-between;
    height: 60px;

    .player-stats {
      display: flex;
      align-items: center;
      height: 100%;

      .stat-item {
        display: flex;
        height: 100%;
        line-height: 60px;
        border: 0;
        background: transparent;
        border-right: 1px solid white;
        color: white;

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
            background: var(--color-alert);
            color: var(--black);
          }
        }
      }
    }

    .alert-container {
      display: flex;
      align-items: center;
      height: 100%;
      width: calc(50% - 80px);
    }
  }
</style>
