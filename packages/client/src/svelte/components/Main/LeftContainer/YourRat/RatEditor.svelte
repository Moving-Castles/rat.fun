<script lang="ts">
  import { rat } from "@svelte/modules/state/base/stores"
  import { dropItem } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import DraggableEntity from "@components/Main/Shared/Entities/DraggableEntity.svelte"

  const initialState = {
    address: "",
    type: "",
    payload: null,
  }

  let busy = $state(false)
  let dragState = $state({ ...initialState })
  let dragAddress = $state("")

  const onDragStart = (address: string, type: string, payload: any) => {
    dragAddress = address
    dragState = {
      address,
      type,
      payload,
    }
  }

  const onDragEnd = () => {
    console.log("on drag end")
    dragState = { ...initialState }
    dragAddress = ""
  }

  const allowDrop = e => e.preventDefault()

  const onDrop = async e => {
    console.log("on drop", dragState)

    e.preventDefault()
    if (busy) return
    busy = true

    try {
      let action
      if (dragState.type === "item") {
        action = dropItem(dragState.address)
      } else {
        console.log("let go of this trait")
      }
      if (action) {
        const result = await waitForCompletion(action)
        console.log(result)
      }
      busy = false
      dragState = { ...initialState }
    } catch (error) {
      console.error(error)
    } finally {
      console.log("Finally")
      busy = false
      onDragEnd()
      dragAddress = ""
    }
  }
</script>

<div class="rat-editor" class:actions={dragAddress !== ""}>
  <div class="inner">
    {$rat?.name ?? ""}
    <!-- HEALTH -->
    <span draggable="false" class="health">
      {$rat.health} health
    </span>
    <!-- BALANCE -->
    {#if $rat?.balance}
      <span draggable="false" class="balance">
        ${$rat.balance}
      </span>
    {/if}
    <!-- TRAITS -->
    {#if $rat?.traits && $rat?.traits?.length > 0}
      is
      {#each $rat?.traits ?? [] as trait, i}
        <DraggableEntity
          {onDragStart}
          {onDragEnd}
          type="trait"
          address={trait}
        />
        {#if i < ($rat?.traits?.length ?? 0) - 2},
        {/if}
        {#if i === ($rat?.traits?.length ?? 0) - 2}
          and
        {/if}
      {/each}
    {/if}
    <!-- INVENTORY -->
    {#if $rat?.inventory && $rat?.inventory?.length > 0}
      has
      {#each $rat?.inventory ?? [] as item, i}
        <DraggableEntity {onDragStart} {onDragEnd} type="item" address={item} />
        {#if i < ($rat?.inventory?.length ?? 0) - 2},
        {/if}
        {#if i === ($rat?.inventory?.length ?? 0) - 2}
          and&nbsp;
        {/if}
      {/each}
    {/if}
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <div ondrop={onDrop} ondragover={allowDrop} class="trash" />
</div>

<style lang="scss">
  .rat-editor {
    display: grid;
    border-bottom: 1px solid white;
    height: var(--rat-editor-height);
    grid-template-rows: 1fr 0;
    transition: grid-template-rows 0.2s ease;
    line-height: 2em;
    overflow: hidden;

    &.actions {
      grid-template-rows: 1fr 60px;
    }
  }

  .inner,
  .trash {
    padding: var(--default-padding);
    color: white;
    border: none;
  }

  .trash {
    background: repeating-linear-gradient(
      45deg,
      black,
      black 20px,
      #222 20px,
      #222 40px
    );
    overflow: hidden;
  }

  .trait,
  .item,
  .health {
    cursor: grab;
    white-space: nowrap;
  }

  .health {
    background-color: var(--color-health);
    color: black;
    padding: 5px;
  }

  .balance {
    background-color: var(--color-value);
    color: black;
    padding: 5px;
  }

  .trash {
    border-top: 1px solid white;
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
