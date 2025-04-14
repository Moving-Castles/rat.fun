<script lang="ts">
  import { traits, items } from "@modules/state/base/stores"
  import { tippy } from "svelte-tippy"
  import type {
    ItemChange,
    TraitChange,
  } from "@components/Main/RoomResult/types"

  let {
    type,
    address,
    fallback,
    onDragStart,
    onDragEnd,
  }: {
    type: "item" | "trait"
    address: string
    fallback: ItemChange | TraitChange
    onDragStart?: (a: string, t: string, i: any) => void
    onDragEnd?: () => void
  } = $props()

  let dragging = $state(false)

  let itemOrTrait = $derived.by(() => {
    const planA = type === "trait" ? $traits?.[address] : $items?.[address]
    if (!planA) {
      return fallback
    } else {
      return planA
    }
  })
</script>

{#if itemOrTrait}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class:dragging
    use:tippy={{
      content:
        type === "item"
          ? "Item carried by your rat, it can be unequipped"
          : "Traits can not be unequipped",
    }}
    ondragstart={() => {
      dragging = true
      onDragStart?.(address, type, itemOrTrait)
    }}
    ondragend={() => {
      dragging = false
      onDragEnd?.()
    }}
    draggable="true"
    class="entity {type}"
  >
    {itemOrTrait?.name} (${itemOrTrait?.value})
  </div>
{/if}

<style>
  .entity {
    cursor: grab;
    white-space: nowrap;
    display: inline-block;
    position: relative;
    top: 5px;
  }

  .trait {
    background-color: #eee;
    color: black;
    padding: 5px;
  }

  .item {
    background-color: orange;
    color: black;
    padding: 5px;
  }

  .dragging {
    opacity: 0.4;
  }
</style>
