<script lang="ts">
  import { fade, fly } from "svelte/transition"
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
    playSound("ratfunUI", "hover3")
  }
</script>

<div
  in:fly={{ duration: 100, y: -30 }}
  class="inventory-item {getRarityClass(item.value)}"
  class:disabled={busy}
  role="button"
  tabindex="0"
  onmouseenter={onMouseEnter}
>
  <div class="inner">
    <!-- NAME -->
    <div class="name">{item.name}</div>
    <!-- VALUE -->
    <span class="value">{CURRENCY_SYMBOL}{item.value}</span>
  </div>
</div>

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
