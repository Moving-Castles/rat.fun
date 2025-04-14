<script lang="ts">
  import { rat } from "@modules/state/base/stores"
  import { dropItem } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import DraggableEntity from "@components/Main/Shared/Entities/DraggableEntity.svelte"
  import { tippy } from "svelte-tippy"

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
    // console.log("on drag end")
    dragState = { ...initialState }
    dragAddress = ""
  }

  const allowDrop = e => e.preventDefault()

  const onDrop = async e => {
    e.stopPropagation()
    e.preventDefault()
    if (busy) return
    busy = true

    try {
      let action
      if (dragState.type === "item") {
        action = dropItem(dragState.address)
        // const result = await new Promise(r => setTimeout(r, 2000))
        await waitForCompletion(action)
        // console.log(result)
      }
      busy = false
      dragState = { ...initialState }
    } catch (error) {
      console.error(error)
    } finally {
      // console.log("Finally")
      busy = false
      onDragEnd()
      dragAddress = ""
    }
  }
</script>

<div class="rat-editor" class:actions={dragAddress !== ""}>
  <div class="inner">
    <div
      class="name"
      draggable="false"
      use:tippy={{ content: "This is your rat's name" }}
    >
      {$rat?.name ?? ""}
    </div>
    <!-- BALANCE -->
    {#if $rat?.balance}
      <div
        use:tippy={{ content: " Tokens carried by your rat" }}
        draggable="false"
        class="balance"
      >
        ${$rat.balance}
      </div>
    {/if}
    <!-- HEALTH -->
    <div
      use:tippy={{ content: " Health of your rat, death at 0" }}
      draggable="false"
      class="health"
    >
      {$rat.health} health
    </div>

    <!-- TRAITS -->
    {#if $rat?.traits && $rat?.traits?.length > 0}
      <div class="word">is</div>
      {#each $rat?.traits ?? [] as trait, i}
        <DraggableEntity type="trait" address={trait} />
        {#if i < ($rat?.traits?.length ?? 0) - 2},
        {/if}
        {#if i === ($rat?.traits?.length ?? 0) - 2}
          <div class="word">and</div>
        {/if}
      {/each}
    {/if}
    <!-- INVENTORY -->
    {#if $rat?.inventory && $rat?.inventory?.length > 0}
      <div class="word">
        {$rat?.traits && $rat?.traits?.length > 0 ? "and" : ""} has
      </div>
      {#each $rat?.inventory ?? [] as item, i}
        <DraggableEntity {onDragStart} {onDragEnd} type="item" address={item} />
        {#if i < ($rat?.inventory?.length ?? 0) - 2},
        {/if}
        {#if i === ($rat?.inventory?.length ?? 0) - 2}
          <div class="word">and</div>
        {/if}
      {/each}
    {/if}
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <div
    class:open={dragAddress !== ""}
    ondrop={onDragEnd}
    ondragover={allowDrop}
    class="cancel"
  />
  <div
    class:open={dragAddress !== ""}
    ondrop={onDrop}
    ondragover={allowDrop}
    class="trash"
  />
</div>

<style lang="scss">
  .rat-editor {
    border-bottom: 1px solid white;
    height: var(--rat-editor-height);
    line-height: 2em;
    overflow-x: hidden;
    overflow-y: scroll;
    position: relative;

    &.actions {
      grid-template-rows: 1fr 60px;
    }
  }

  .inner {
    padding: var(--default-padding);
    color: white;
    border: none;
    display: inline-flex;
    // align-items: center;
    height: 100%;
    overflow-y: scroll;
    display: flex;
    flex-flow: row wrap;
    row-gap: 4px;
    column-gap: 4px;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .trait,
  .item,
  .health,
  .balance,
  .name {
    cursor: grab;
    white-space: nowrap;
    border: 1px solid white;
    display: block;
    height: 50px;
    align-self: flex-start;
  }

  .word,
  .name {
    background-color: black;
    color: white;
    padding: 10px;
    display: block;
  }

  .health {
    background-color: var(--color-health);
    color: black;
    padding: 10px;
    display: block;
  }

  .balance {
    background-color: var(--color-value);
    color: black;
    padding: 10px;
    display: inline-block;
  }

  .cancel,
  .trash {
    height: 100%;
    aspect-ratio: 1;
    width: 0;
    display: block;
    position: absolute;
    bottom: 0;
    top: 0;
    right: 0;
    z-index: 1;
    transition: width 0.2s ease;
    overflow: hidden;

    &.open {
      width: 50%;
    }
  }

  .trash {
    animation: warn-lines 1s infinite linear;
    &.open {
      border-left: 1px solid white;
    }
  }

  .cancel {
    left: 0;
    right: auto;

    &.open {
      // border-right: 1px solid white;
    }
  }

  @keyframes warn-lines {
    0% {
      background: repeating-linear-gradient(
        45deg,
        black,
        black 20px,
        #222 20px,
        #222 40px
      );
    }
    100% {
      background: repeating-linear-gradient(
        45deg,
        #f0d000,
        #f0d000 20px,
        #bda400 20px,
        #bda400 40px
      );
    }
  }
</style>
