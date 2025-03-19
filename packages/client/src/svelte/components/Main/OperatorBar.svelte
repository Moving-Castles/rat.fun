<script lang="ts">
  import { player } from "@modules/state/base/stores"
</script>

<!-- PLAYER STATS -->
{#if $player}
  <!-- NAME -->
  <div class="operator-bar">
    <div class="stat-item">
      <div class="inner-wrapper operator">
        <div class="label">Operator:</div>
        <div class="value">{$player.name}</div>
      </div>
    </div>
    <!-- BALANCE -->
    <div class="stat-item">
      <div class="inner-wrapper balance">
        <div class="label">Balance:</div>
        <div class="value">${$player?.balance ?? 0}</div>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .operator-bar {
    width: 100%;
    border-bottom: 1px solid white;
    display: flex;
    align-items: center;
    height: 60px;
  }

  .stat-item {
    display: flex;
    height: 100%;
    border-right: 1px solid white;
    line-height: 60px;

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

      &.operator {
        background: var(--color-alert);
        color: var(--black);
      }
    }
  }

  .action {
    button {
      padding: 5px;
      color: var(--black);
      cursor: pointer;
      margin-left: 20px;
    }
  }
</style>
