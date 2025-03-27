<script lang="ts">
  import { traits, items } from "@svelte/modules/state/base/stores"

  let {
    type,
    address,
    fallback,
    onDragStart,
    onDragEnd,
  }: {
    type: "item" | "trait"
    address: string
    fallback: { name: string; value: string }
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
  <span
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
  </span>
{/if}

<style>
  .entity {
    cursor: grab;
    white-space: nowrap;
    display: inline-block;
  }
  .trait {
    background-color: #eee;
    color: black;
    padding: 10px;
  }
  .item {
    background-color: orange;
    color: black;
    padding: 10px;
  }
</style>
