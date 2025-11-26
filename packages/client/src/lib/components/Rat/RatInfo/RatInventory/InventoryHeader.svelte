<script lang="ts">
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings"
  import { Tooltip } from "$lib/components/Shared"
</script>

<div class="inventory-header-wrapper">
  <Tooltip content={UI_STRINGS.psychoObjectExplanation}>
    <div class="inventory-header">
      {UI_STRINGS.psychoInventory}
    </div>
  </Tooltip>
</div>

<style lang="scss">
  .inventory-header-wrapper {
    height: 40px;
    flex-shrink: 0;
    border-bottom: var(--dashed-border-style);
    background: rgba(0, 0, 0, 0.3);

    .inventory-header {
      height: 100%;
      font-family: var(--typewriter-font-stack);
      font-size: var(--font-size-normal);
      cursor: help;
      text-align: left;
      padding-left: 10px;
      line-height: 40px;
    }
  }
</style>
