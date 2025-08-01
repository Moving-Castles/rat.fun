<script lang="ts">
  import type { TempItem } from "$lib/components/Room/RoomResult/types"
  import { items } from "$lib/modules/state/stores"
  import {
    RAT_BOX_STATE,
    transitionTo,
    getItemState
  } from "$lib/components/Rat/RatBox/state.svelte"

  let {
    item
  }: {
    item: string | TempItem
  } = $props()

  let { item: itemState } = getItemState()

  let busy = $state(false)
  let isHovered = $state(false)

  // Item might be the id of an item or a TempItem object
  const name = $derived(typeof item === "string" ? ($items[item]?.name ?? "---") : item.name)
  const value = $derived(typeof item === "string" ? ($items[item]?.value ?? 0) : item.value)

  // Get the item ID for state management
  const itemId = $derived(typeof item === "string" ? item : item.id)
</script>

<button
  class="list-item"
  class:disabled={busy}
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
  onclick={() => {
    itemState.set(itemId)
    transitionTo(RAT_BOX_STATE.CONFIRM_RE_ABSORB_ITEM)
  }}
>
  <!-- NAME -->
  <div class="name">{!isHovered ? name : "Re-absorb item"}</div>
  <!-- VALUE -->
  <span class="value" class:negative={value < 0}>${value}</span>
</button>

<style lang="scss">
  .list-item {
    font-size: var(--font-size-small);
    display: flex;
    gap: 10px;
    background: var(--color-grey-dark);
    color: var(--foreground);
    padding: 5px;
    margin: 5px;
    justify-content: space-between;
    border: none;
    outline: none;
    width: calc(100% - 10px);
    cursor: pointer;
    text-align: left;

    .value {
      color: var(--color-success);
      &.negative {
        color: var(--color-death);
      }
    }

    &:hover {
      background: var(--color-death);
      color: var(--background);

      .value {
        color: var(--background);
      }
    }
  }

  button[disabled] {
    background: var(--color-grey-mid);
  }
</style>
