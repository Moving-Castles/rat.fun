<script lang="ts">
  import { addItemToLoadOut } from "@svelte/modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  // import { NewItem } from "@components/Nest/types"

  type NewItem = {
    name: string
    value: number
  }

  export let key: string = ""
  export let item: Item | NewItem

  let busy = false

  async function sendAddItemToLoadOut() {
    console.log("sendAddItemToLoadOut", key, item)
    playSound("tcm", "selectionEnter")
    busy = true
    const action = addItemToLoadOut(key)
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }
</script>

<button class="item" disabled={busy} on:click={sendAddItemToLoadOut}>
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
