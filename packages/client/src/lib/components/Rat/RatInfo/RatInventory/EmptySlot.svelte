<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let { index }: { index: number } = $props()

  let isHovered = $state(false)

  const onMouseEnter = () => {
    playSound({ category: "ratfunUI", id: "hover" })
    isHovered = true
  }

  const onMouseLeave = () => {
    isHovered = false
  }
</script>

<div
  style="--msg-empty: '{UI_STRINGS.empty.toUpperCase()}'"
  class="empty-slot index-{index}"
  class:hovered={isHovered}
  role="button"
  tabindex="0"
  onmouseenter={onMouseEnter}
  onmouseleave={onMouseLeave}
></div>

<style lang="scss">
  .empty-slot {
    background: var(--background-light-transparent);
    border: 1px solid var(--background-semi-transparent);
    min-height: 40px;
    opacity: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    text-align: center;

    &::before {
      content: var(--msg-empty);
      color: var(--foreground-semi-transparent);
      font-size: var(--font-size-normal);
      opacity: 0;
      transition: opacity 0.2s ease;
      width: 100%;
      pointer-events: none;
    }

    &:hover::before {
      opacity: 1;
    }
  }
</style>
