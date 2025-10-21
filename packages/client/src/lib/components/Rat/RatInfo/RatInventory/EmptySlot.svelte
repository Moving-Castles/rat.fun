<script lang="ts">
  import { fade } from "svelte/transition"
  import { playSound } from "$lib/modules/sound"

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
  class="empty-slot"
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
      content: "EMPTY";
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
