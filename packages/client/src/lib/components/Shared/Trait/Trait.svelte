<script lang="ts">
  import type { TempItem } from "$lib/components/Room/RoomResult/types"
  import { traits } from "$lib/modules/state/base/stores"

  let { trait }: { trait: string | TempItem } = $props()

  // Trait might be the id of a trait or a TempItem object

  const name = $derived(typeof trait === "string" ? ($traits[trait]?.name ?? "---") : trait.name)

  const value = $derived(typeof trait === "string" ? ($traits[trait]?.value ?? 0) : trait.value)
</script>

<div class="list-item">
  <!-- NAME -->
  <div class="name">{name}</div>
  <!-- VALUE -->
  <span class="value" class:negative={value < 0}>${value}</span>
</div>

<style lang="scss">
  .list-item {
    font-size: var(--font-size-small);
    display: flex;
    gap: 10px;
    background: var(--color-grey-dark);
    padding: 5px;
    margin: 5px;
    justify-content: space-between;
    align-items: center;

    .name {
      flex: 1;
    }

    .value {
      color: var(--color-health);
      padding: 2px 6px;
      line-height: 1;
      &.negative {
        background: var(--color-death);
        color: var(--background);
      }
    }
  }
</style>
