<script lang="ts">
  import { fade } from "svelte/transition"
  import { playSound } from "$lib/modules/sound"

  let {
    item,
    index
  }: {
    item: Item
    index: number
  } = $props()

  let busy = $state(false)
  let isHovered = $state(false)

  const onMouseEnter = () => {
    playSound("ratfunUI", "hover")
    isHovered = true
  }

  const onMouseLeave = () => {
    isHovered = false
  }
</script>

<div
  class="list-item"
  class:disabled={busy}
  class:hovered={isHovered}
  in:fade|global={{ duration: 100, delay: index * 50 }}
  role="button"
  tabindex="0"
  onmouseenter={onMouseEnter}
  onmouseleave={onMouseLeave}
>
  <div class="inner">
    <!-- NAME -->
    <div class="name">{item.name}</div>
    <!-- VALUE -->
    <span class="value" class:negative={item.value < 0}>${item.value}</span>
  </div>
</div>

<style lang="scss">
  .list-item {
    font-size: var(--font-size-normal);
    display: flex;
    background: var(--color-grey-light);
    color: var(--background);
    padding: 5px;
    justify-content: center;
    align-items: center;
    border: none;
    outline: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &.hovered {
      background: var(--color-grey-mid);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .value {
      color: var(--color-success);
      &.negative {
        color: var(--color-death);
      }
    }
  }

  .inner {
    text-align: center;
  }
</style>
