<script lang="ts">
  import { ratLevel, levels, gameConfig } from "$lib/modules/state/base/stores"

  let currentFloor = $derived(
    $ratLevel ? $ratLevel : $levels[$gameConfig?.levelList[0] ?? "unknown level"]
  )
</script>

<div class="floor-header">
  <div class="inner">
    <div class="title">
      <span>World prompt: {$gameConfig?.worldPrompt ?? ""}</span>
      <!-- <span>Floor #{Number(currentFloor.index) * -1}: {currentFloor.name}</span> -->
    </div>
    <!-- {#if currentFloor.prompt}
      <div class="prompt">
        <span>{currentFloor.prompt}</span>
      </div>
    {/if} -->
  </div>
</div>

<style lang="scss">
  .floor-header {
    // border-bottom: 1px solid red;
    overflow: hidden;
    position: sticky;
    top: 0;
    z-index: var(--z-high);
    background: var(--background);

    .inner {
      width: 100%;
      border-bottom: var(--default-border-style);
      padding: 10px;
      display: flex;
      min-height: 61px;

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
  }
</style>
