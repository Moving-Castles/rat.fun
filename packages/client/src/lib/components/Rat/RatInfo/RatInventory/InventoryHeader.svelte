<script lang="ts">
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { Tooltip } from "$lib/components/Shared"

  let {
    filledSlots,
    totalSlots,
    totalValue
  }: {
    filledSlots: number
    totalSlots: number
    totalValue: number
  } = $props()
</script>

<div class="inventory-header-wrapper">
  <Tooltip content={UI_STRINGS.psychoObjectExplanation}>
    <div class="inventory-header">
      <div class="inventory-header-title">
        {UI_STRINGS.psychoInventory}
      </div>
      <div class="inventory-header-count">{filledSlots}/{totalSlots}</div>
      <div class="inventory-header-total-value">{totalValue} {CURRENCY_SYMBOL}</div>
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
      display: flex;
      width: 100%;
      justify-content: space-between;
      align-items: center;
      padding-inline: 10px;

      .inventory-header-title {
        width: calc(100% / 3);
        font-size: var(--font-size-normal);
      }

      .inventory-header-count {
        width: calc(100% / 3);
        font-size: var(--font-size-small);
        text-align: center;
      }

      .inventory-header-total-value {
        width: calc(100% / 3);
        font-size: var(--font-size-small);
        text-align: right;
      }
    }
  }
</style>
