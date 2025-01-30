<script lang="ts">
  import {
    transferItemToLoadOut,
    transferItemToInventory,
  } from "@svelte/modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import type { ItemChange } from "../types"

  export let isRat = false
  export let key: string = ""
  export let item: Item | ItemChange

  let busy = false

  async function sendTransfer() {
    playSound("tcm", "selectionEnter")
    busy = true
    const action = isRat
      ? transferItemToInventory(key)
      : transferItemToLoadOut(key)
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }
</script>

<button class="item" disabled={busy} on:click={sendTransfer}>
  <div class="text">{item.name} (${item.value})</div>
</button>

<style lang="scss">
  .item {
    border: none;
    font-size: var(--font-size-normal);
    padding: 10px;
    background: var(--color-item);
    display: inline-block;
    cursor: pointer;
    margin-right: 5px;
    margin-bottom: 5px;
    text-transform: uppercase;

    .text {
      position: relative;
      top: 2px;
    }
  }
</style>
