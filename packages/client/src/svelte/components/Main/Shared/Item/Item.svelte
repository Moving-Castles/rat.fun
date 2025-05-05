<script lang="ts">
  import { items } from "@modules/state/base/stores"
  import { dropItem } from "@svelte/modules/action"
  import { playSound } from "@modules/sound"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { ModalTarget } from "@components/Main/Modal/state.svelte"
  import { getModalState } from "@components/Main/Modal/state.svelte"
  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"

  import type { TempItem } from "@components/Main/RoomResult/types"

  let {
    item,
    isRoomInfoBox = false,
  }: {
    item: string | TempItem
    isRoomInfoBox: boolean
  } = $props()

  let busy = $state(false)
  let confirming = $state(false)
  let dropMessage = $state("CONFIRM ITEM DROP")
  let isHovered = $state(false)
  let dropCompleted = $state(false)

  let { modal } = getModalState()

  // Item might be the id of an item or a TempItem object

  const name = $derived(
    typeof item === "string" ? ($items[item]?.name ?? "---") : item.name
  )

  const value = $derived(
    typeof item === "string" ? ($items[item]?.value ?? 0) : item.value
  )

  const sendDropItem = async () => {
    if (typeof item !== "string") {
      console.error("Not id")
      return
    }
    if (busy) return
    playSound("tcm", "blink")
    busy = true
    dropMessage = "Dropping item..."
    const action = dropItem(item)
    try {
      await waitForCompletion(action)
      playSound("tcm", "TRX_no")
      dropCompleted = true
      dropMessage = "Close"
    } catch (e) {
      console.error(e)
      dropMessage = "Error occurred"
    } finally {
      busy = false
    }
  }

  const handleModalClose = () => {
    modal.close()
  }
</script>

<button
  class="list-item"
  class:clickable={!isRoomInfoBox}
  onmouseenter={() => !isRoomInfoBox && (isHovered = true)}
  onmouseleave={() => !isRoomInfoBox && (isHovered = false)}
  onclick={() => !isRoomInfoBox && (confirming = true)}
>
  <!-- NAME -->
  <div class="name">{isRoomInfoBox || !isHovered ? name : "Drop item"}</div>
  <!-- VALUE -->
  <div class="value" class:negative={value < 0}>${value}</div>
</button>

{#snippet confirmDrop()}
  <div class="confirmation danger">
    <div class="content">
      <div class="drop-message">Drop {name}?</div>
      <button
        disabled={busy}
        onclick={dropCompleted
          ? () => {
              modal.close()
            }
          : sendDropItem}
        class="modal-button"
        class:close-button={dropCompleted}
      >
        {#if busy}
          <Spinner />
        {:else}
          {dropMessage}
        {/if}
      </button>
    </div>
  </div>
{/snippet}

{#if confirming}
  <ModalTarget
    onclose={handleModalClose}
    content={confirmDrop}
    noclose={false}
  />
{/if}

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
      color: var(--color-health);
      &.negative {
        color: var(--color-death);
      }
    }

    &.clickable {
      cursor: pointer;
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

    .drop-message {
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
        background: var(--color-health);

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
