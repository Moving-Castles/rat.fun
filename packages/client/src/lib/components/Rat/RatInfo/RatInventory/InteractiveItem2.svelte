<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  let {
    item,
    index
  }: {
    item: Item
    index: number
  } = $props()

  let busy = $state(false)

  // Determine rarity class based on value
  const getRarityClass = (value: bigint | number) => {
    const numValue = typeof value === "bigint" ? Number(value) : value
    if (numValue >= 100) return "holographic"
    if (numValue >= 50) return "gold"
    if (numValue >= 20) return "silver"
    return "copper"
  }

  const onMouseEnter = () => {
    playSound({ category: "ratfunUI", id: "hover3" })
  }
</script>

<div
  class="inventory-item-wrapper {getRarityClass(item.value)} index-{index}"
  class:disabled={busy}
  role="button"
  tabindex="0"
  onmouseenter={onMouseEnter}
>
  <div class="inventory-item">
    <div class="item-front">
      <div class="name">{item.name}</div>
    </div>
    <div class="item-back">
      <div class="value">{Number(item.value)} {CURRENCY_SYMBOL}</div>
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

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
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
    justify-content: center;
    align-items: center;
    background: rgba(200, 200, 200, 0.95);
    color: var(--background);
    padding: 5px;
    border: 8px inset rgba(255, 255, 255, 0.4);
    outline: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .item-front {
    z-index: 2;
    transform: rotateY(0deg);
  }

  .item-back {
    transform: rotateY(180deg);
    background: rgba(255, 238, 83, 0.95);
  }

  .name,
  .value {
    text-align: center;
  }
</style>
