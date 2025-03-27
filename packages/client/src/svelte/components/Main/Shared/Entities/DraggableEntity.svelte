<script lang="ts">
  import { traits, items } from "@svelte/modules/state/base/stores"

  let { type, address, onDragStart, onDragEnd } = $props()
  let dragging = $state(false)

  const itemOrTrait = type === "trait" ? $traits?.[address] : $items?.[address]
</script>

{#if itemOrTrait}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <span
    ondragstart={() => {
      dragging = true
      onDragStart(address, type, itemOrTrait)
    }}
    ondragend={() => {
      dragging = false
      onDragEnd()
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
</style>
