<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { Tooltip } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

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

<Tooltip content={UI_STRINGS.itemExplanation}>
  <div
    class="inventory-item {getRarityClass(item.value)} index-{index}"
    class:disabled={busy}
    role="button"
    tabindex="0"
    onmouseenter={onMouseEnter}
  >
    <div class="inner">
      <!-- NAME -->
      <div class="name">{item.name}</div>
      <!-- VALUE -->
      <span class="value">{item.value} {CURRENCY_SYMBOL}</span>
    </div>
  </div>
</Tooltip>

<style lang="scss">
  .inventory-item {
    font-size: var(--font-size-large);
    font-family: var(--special-font-stack);
    display: flex;
    background: rgba(200, 200, 200, 0.9);
    color: var(--background);
    padding: 5px;
    justify-content: center;
    align-items: center;
    outline: none;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    border: 10px inset rgba(0, 0, 0, 0.5);
    transition: transform 0.2s ease;
    border-radius: 10px;
    user-select: none;

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:hover {
      transform: translateY(-5px);
    }

    .value {
      font-family: var(--typewriter-font-stack);
      font-size: var(--font-size-normal);
      // color: green;
    }
  }

  .inner {
    text-align: center;
  }
</style>
