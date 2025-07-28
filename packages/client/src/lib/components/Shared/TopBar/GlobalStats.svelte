<script lang="ts">
  import { worldStats } from "$lib/modules/state/stores"
</script>

<div class="world-stats">
  <p>
    total kills: {$worldStats?.globalRatKillCount ?? 0}
    <br />last kill: {$worldStats?.lastKilledRatBlock ?? 0}
  </p>
</div>

<style lang="scss">
  .world-stats {
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: var(--default-border-style);
    height: var(--pane-switch-height);
    background: var(--color-grey-mid);
    position: relative;
    background: rgba(255, 0, 0, 0.5);
    padding-inline: 40px;
  }
</style>
