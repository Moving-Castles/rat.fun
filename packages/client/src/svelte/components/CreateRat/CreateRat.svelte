<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte"
  import { createRat } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { playSound } from "@modules/sound"
  import { playerRat } from "@modules/state/base/stores"
  import { ENTITY_TYPE } from "contracts/enums"

  import Spinner from "@components/Spinner/Spinner.svelte"

  const dispatch = createEventDispatcher()

  const done = () => dispatch("done")

  let busy = false

  async function sendCreateRat() {
    playSound("tcm", "blink")
    busy = true
    const action = createRat()
    try {
      await waitForCompletion(action)
      done()
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }

  onMount(() => {
    if ($playerRat && $playerRat.entityType === ENTITY_TYPE.RAT) {
      done()
    }
  })
</script>

<div class="main">
  <div>
    <img src="/images/rat.jpg" alt="rat" />
    <button disabled={busy} on:click={sendCreateRat}>Adopt a rat</button>
  </div>
  {#if busy}
    <Spinner />
  {/if}
</div>

<style lang="scss">
  .main {
    text-align: center;
    padding: 10px;
    background: rgb(88, 88, 88);
    color: white;
    width: 40%;
  }

  button {
    padding: 20px;
    margin-top: 20px;
    font-size: 24px;
    width: 100%;
    cursor: pointer;

    &:hover {
      background: green;
    }
  }
</style>
