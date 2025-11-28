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
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 0, 0, 0.4);
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
      color: rgba(255, 255, 255, 0.6);
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
