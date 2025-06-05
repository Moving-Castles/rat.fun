<script lang="ts">
  import { levels } from "@modules/state/base/stores"
  import { tippy } from "svelte-tippy"

  const { levelId, i }: { levelId: string; i: number } = $props()

  // Prompt: ${$levels[levelId].prompt}
  let toolTipText = $derived(
    `Name: ${$levels[levelId].name} / Min: ${$levels[levelId].levelMinBalance} / Max: ${$levels[levelId].levelMaxBalance}`
  )
</script>

<div
  use:tippy={{
    content: toolTipText,
  }}
  class="floor-item"
>
  {i * -1}
</div>

<style lang="scss">
  .floor-item {
    width: 100%;
    height: calc(100% / 5);
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: var(--dashed-border-style);
    position: relative;
    font-size: 18px;

    &:last-child {
      border-bottom: none;
    }
  }
</style>
