<script lang="ts">
  import { Tooltip } from "$lib/components/Shared"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let { maxValuePerWin }: { maxValuePerWin: number } = $props()
</script>

<div class="meta-data-item max-win">
  <Tooltip content={UI_STRINGS.maxValuePerWin}>
    <div class="inner">{maxValuePerWin} {CURRENCY_SYMBOL}</div>
  </Tooltip>
</div>

<style lang="scss">
  .meta-data-item {
    background: rgba(255, 255, 255, 0.4);
    color: var(--background);
    margin-bottom: 5px;
    border-radius: 4px;
    font-size: var(--font-size-normal);
    height: 40px;

    .inner {
      padding: 10px;
    }
  }
</style>
