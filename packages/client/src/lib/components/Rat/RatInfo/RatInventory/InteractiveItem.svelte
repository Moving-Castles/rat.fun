<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { ResizableText } from "$lib/components/Shared"
  import { isPhone } from "$lib/modules/ui/state.svelte"

  let {
    item,
    index,
    itemId,
    onExport
  }: {
    item: Item
    index: number
    itemId?: string
    onExport?: (itemId: string) => void
  } = $props()

  const handleExport = (e: MouseEvent) => {
    e.stopPropagation()
    if (onExport && itemId) {
      playSound({ category: "ratfunUI", id: "click" })
      onExport(itemId)
    }
  }

  const onMouseEnter = () => {
    playSound({ category: "ratfunUI", id: "hover3" })
  }
</script>

<div
  class="inventory-item-wrapper index-{index}"
  role="button"
  tabindex="0"
  onmouseenter={onMouseEnter}
>
  <div class="inventory-item">
    <div class="item-front">
      {#if $isPhone}
        <ResizableText>
          {item.name}
        </ResizableText>
      {:else}
        <div class="name">{item.name}</div>
      {/if}
    </div>
    <div class="item-back">
      <div class="value">{Number(item.value)} {CURRENCY_SYMBOL}</div>
      {#if onExport && itemId}
        <button class="export-button" onclick={handleExport}> Extract NFT </button>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .inventory-item-wrapper {
    font-size: var(--font-size-large);
    font-family: var(--special-font-stack);
    width: 100%;
    height: 100%;
    position: relative;
    perspective: 1000px;
    user-select: none;
  }

  .inventory-item {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.3s ease;

    .inventory-item-wrapper:hover & {
      transform: rotateY(180deg);
    }
  }

  .item-front,
  .item-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: var(--color-inventory-item-background);
    color: var(--background);
    padding: 5px;
    border: 8px ridge var(--background-semi-transparent);
    outline: none;
    box-shadow: 0 4px 8px var(--background-light-transparent);
  }

  .item-front {
    z-index: 2;
    transform: rotateY(0deg);
  }

  .item-back {
    transform: rotateY(180deg);
    position: relative;
    background: var(--color-inventory-item-reverse-side);
  }

  .name,
  .value {
    text-align: center;
  }

  .export-button {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 40px;
    margin-top: 8px;
    padding: 4px 8px;
    font-size: var(--font-size-small);
    font-family: var(--special-font-stack);
    background: var(--color-grey-light);
    color: var(--background);
    border: none;
    border-style: outset;
    border-width: 4px;
    border-color: var(--background-light-transparent);
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
      background: var(--color-grey-lighter);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
</style>
