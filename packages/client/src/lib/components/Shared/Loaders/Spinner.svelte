<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import { playUISound } from "$lib/modules/sound/state.svelte"
  import { getRandomUint32 } from "$lib/modules/utils"

  let spinner: number = getRandomUint32()
  let timer: number

  onMount(() => {
    timer = window.setInterval(() => {
      spinner = getRandomUint32()
      playUISound("ratfun", "TRX_wait_a")
    }, 100)
  })

  onDestroy(() => {
    window.clearInterval(timer)
  })
</script>

<span class="spinner">{spinner}</span>

<style lang="scss">
  .spinner {
    opacity: 0.6;
    width: 100%;
    overflow: hidden;
  }
</style>
