<script lang="ts">
  import { rat } from "@modules/state/base/stores"
</script>

<div class="rat-info-box">
  {#if $rat}
    <!-- INFO -->
    <div class=" info">
      <!-- INDEX -->
      <div class="info-item">
        <span class="index">RAT #{$rat.index}</span>
      </div>

      <!-- NAME -->
      <div class="info-item">
        <span class="name">{$rat.name}</span>
      </div>

      <!-- BALANCE -->
      <div class="info-item">
        <span class="balance">${$rat.balance}</span>
      </div>

      <!-- HEALTH -->
      <div class="info-item">
        <span class="health" class:dead={$rat.health <= 0}
          >HEALTH {$rat.health}</span
        >
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .rat-info-box {
    width: 100%;
    height: 100%;
    border-right: none;
    overflow: hidden;
    display: flex;
  }

  .info-item {
    display: flex;
    margin: 10px;
    gap: 5px;

    .index {
      background: var(--color-grey-light);
      padding: 5px;
      color: black;
      font-size: var(--font-size-small);
    }

    .name {
      background: var(--color-alert);
      padding: 5px;
      color: black;
      font-family: var(--display-font-stack);
      font-size: var(--font-size-large);
    }

    .balance {
      background: var(--color-value);
      padding: 5px;
      color: black;
    }

    .health {
      background: var(--color-health);
      padding: 5px;
      color: black;

      &.dead {
        background: var(--color-death);
      }
    }
  }

  .header {
    border-bottom: var(--dashed-border-style);
    padding: 10px;
    display: flex;
    justify-content: space-between;

    .counter {
      font-size: var(--font-size-small);
      color: var(--color-grey-light);
      position: relative;
      top: 3px;
    }
  }
</style>
