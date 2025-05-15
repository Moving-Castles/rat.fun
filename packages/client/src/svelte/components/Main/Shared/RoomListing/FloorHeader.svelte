<script lang="ts">
  import { ratLevel, levels, gameConfig } from "@modules/state/base/stores"

  let currentFloor = $derived(
    $ratLevel ? $ratLevel : $levels[$gameConfig.levelList[0]]
  )
</script>

<div class="floor-header">
  <div class="title">
    <span>Floor #{Number(currentFloor.index) * -1}: {currentFloor.name}</span>
  </div>
  {#if currentFloor.prompt}
    <div class="prompt">
      <span>{currentFloor.prompt}</span>
    </div>
  {/if}
</div>

<style lang="scss">
  .floor-header {
    line-height: 60px;
    border-bottom: var(--default-border-style);
    padding-inline: 10px;
    display: flex;
    overflow: hidden;
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--background);

    .title {
      font-size: var(--font-size-small);
      margin-right: 10px;

      span {
        background: var(--color-alert);
        padding: 5px;
        color: var(--background);
      }
    }

    .prompt {
      font-size: var(--font-size-small);

      span {
        background: var(--color-alert-priority);
        padding: 5px;
        color: var(--background);
      }
    }
  }
</style>
