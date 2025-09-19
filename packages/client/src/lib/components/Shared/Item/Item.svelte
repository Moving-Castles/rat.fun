<script lang="ts">
  import type { TempItem } from "$lib/components/Room/Trip/types"
  import { items } from "$lib/modules/state/stores"
  import { getItemState } from "$lib/components/Rat/RatBox/state.svelte"

  let {
    item,
    isRoomInfoBox = false
  }: {
    item: string | TempItem
    isRoomInfoBox?: boolean
  } = $props()

  let { item: itemState } = getItemState()

  let busy = $state(false)
  let isHovered = $state(false)

  // Item might be the id of an item or a TempItem object
  const name = $derived(typeof item === "string" ? ($items[item]?.name ?? "---") : item.name)

  const value = $derived(typeof item === "string" ? ($items[item]?.value ?? 0) : item.value)
</script>

<div
  class="list-item"
  class:disabled={busy}
  role="listitem"
  onmouseenter={() => !isRoomInfoBox && (isHovered = true)}
  onmouseleave={() => !isRoomInfoBox && (isHovered = false)}
>
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
    color: var(--foreground);
    padding: 5px;
    margin: 5px;
    justify-content: space-between;
    border: none;
    outline: none;
    width: calc(100% - 10px);
    cursor: default;
    text-align: left;

    .value {
      color: var(--color-success);
      &.negative {
        color: var(--color-death);
      }
    }

    &.clickable {
      cursor: default;
      &:hover {
        background: var(--color-death);
        color: var(--background);

        .value {
          color: var(--background);
        }
      }
    }
  }

  .confirmation {
    .content {
      height: 100%;
      display: flex;
      flex-flow: column nowrap;
      justify-content: space-between;
      align-items: center;
      padding: var(--default-padding);
    }

    .sale-message {
      font-size: var(--font-size-large);
      margin-bottom: var(--default-padding);
    }

    button {
      height: 60px;
      width: 100%;
      border: var(--default-border-style);
      color: var(--background);
      background: var(--color-death);

      &:hover {
        background: var(--background);
        color: var(--foreground);
      }

      &.close-button {
        background: var(--color-success);

        &:hover {
          background: var(--background);
          color: var(--foreground);
        }
      }
    }
  }

  button[disabled] {
    background: var(--color-grey-mid);
  }
</style>
