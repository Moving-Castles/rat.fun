<script lang="ts">
  import { fade } from "svelte/transition"
  import { playSound } from "$lib/modules/sound"
  import { strings } from "$lib/modules/strings"

  let { index }: { index: number } = $props()

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
  style="--msg-empty: '{strings.empty.toUpperCase()}'"
  in:fade|global={{ duration: 80, delay: 20 + index * 20 }}
  class="empty-slot index-{index}"
  class:hovered={isHovered}
  role="button"
  tabindex="0"
  onmouseenter={onMouseEnter}
  onmouseleave={onMouseLeave}
></div>

<style lang="scss">
  .empty-slot {
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid black;
    min-height: 40px;
    opacity: 0.5;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    &::before {
      content: var(--msg-empty);
      color: rgba(255, 255, 255, 0.6);
      font-size: var(--font-size-normal);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover::before {
      opacity: 1;
    }
  }
</style>
