<script lang="ts">
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { Tooltip } from "$lib/components/Shared"

  let {
    filledSlots,
    totalSlots,
    nftCount = 0,
    onImportClick
  }: {
    filledSlots: number
    totalSlots: number
    nftCount?: number
    onImportClick?: () => void
  } = $props()

  let hasNFTs = $derived(nftCount > 0 && onImportClick !== undefined)
</script>

<div class="inventory-header-wrapper">
  <div class="inventory-header">
    <div class="left">
      <Tooltip content={UI_STRINGS.itemExplanation}>
        <div class="inventory-header-title">
          {UI_STRINGS.inventoryName}
          <span class="inventory-header-count">{filledSlots}/{totalSlots}</span>
        </div>
      </Tooltip>
    </div>
    {#if hasNFTs}
      <div class="right">
        <Tooltip content="Re-inject NFTs you've extracted from rats">
          <button class="import-nfts-button" onclick={onImportClick}>INJECT PSYCHO OBJECT</button>
        </Tooltip>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .inventory-header-wrapper {
    height: 40px;
    flex-shrink: 0;
    border-bottom: var(--default-border-style);
    background: var(--background-semi-transparent);

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
        white-space: nowrap;
        overflow: hidden;
        width: auto;
        font-size: var(--font-size-small);

        @media screen and (min-width: 800px) {
          font-size: var(--font-size-normal);
        }

        .inventory-header-count {
          opacity: 0.7;
          text-align: center;
        }
      }

      .import-nfts-button {
        font-size: var(--font-size-small);
        margin: -32px -12px;
        height: 40px;
        padding: 4px 12px;
        background: var(--color-grey-light);
        border: none;
        border-style: outset;
        border-width: 4px;
        border-color: var(--background-light-transparent);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          background: var(--color-grey-lighter);
          // transform: scale(1.05);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }
</style>
