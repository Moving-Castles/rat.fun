<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte"
  import { ready, loadingMessage } from "@modules/network"
  import { initNetwork } from "@svelte/initNetwork"
  import { initEntities } from "@svelte/modules/systems/initEntities"
  import { ENVIRONMENT } from "@mud/enums"

  export let environment: ENVIRONMENT

  const dispatch = createEventDispatcher()

  const done = () => dispatch("done")

  // Finished when chain is ready
  $: if ($ready) {
    initEntities()
    done()
  }

  onMount(async () => {
    console.log("initializing network")
    await initNetwork(environment)
    console.log("environment", environment)
  })
</script>

<div class="loading" class:done={Number($loadingMessage) === 100}>
  <div>{$loadingMessage}</div>
</div>

<style lang="scss">
  .loading {
    text-align: center;
  }
</style>
