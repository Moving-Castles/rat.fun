<script lang="ts">
  import { removeItemFromLoadOut } from "@svelte/modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"

  export let key: string
  export let item: Item

  let busy = false

  async function sendRemoveItemFromLoadOut() {
    console.log("sendRemoveItemFromInventory", key, item)
    playSound("tcm", "selectionEnter")
    busy = true
    const action = removeItemFromLoadOut(key)
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }
</script>

<button class="item" disabled={busy} on:click={sendRemoveItemFromLoadOut}>
  {item.name} (${item.value})
</button>

<style lang="scss">
  .item {
    border: none;
    font-size: 18px;
    padding: 10px;
    background: orangered;
    display: inline-block;
    border-radius: 5px;
    cursor: pointer;
    margin-right: 10px;
  }
</style>
