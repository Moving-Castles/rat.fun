<script lang="ts">
  import { traits } from "@modules/state/base/stores"
  import type { TempItem } from "@components/Main/RoomResult/types"

  let { trait }: { trait: string | TempItem } = $props()

  // Trait might be the id of a trait or a TempItem object

  const name = $derived(
    typeof trait === "string" ? ($traits[trait]?.name ?? "---") : trait.name
  )

  const value = $derived(
    typeof trait === "string" ? ($traits[trait]?.value ?? 0) : trait.value
  )
</script>

<div class="list-item">
  <!-- NAME -->
  <div class="name">{name}</div>
  <!-- VALUE -->
  <div class="value" class:negative={value < 0}>${value}</div>
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

    .value {
      color: var(--color-health);
      &.negative {
        background: var(--color-death);
        color: var(--background);
      }
    }
  }
</style>
