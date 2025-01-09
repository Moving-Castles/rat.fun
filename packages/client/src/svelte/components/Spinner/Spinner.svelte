<script lang="ts">
  import { playSound } from "@svelte/modules/sound"
  import { getRandomUint256 } from "@svelte/modules/utils"
  import { onDestroy, onMount } from "svelte"

  let spinner: BigInt = getRandomUint256()
  let timer: number

  onMount(() => {
    timer = window.setInterval(() => {
      spinner = getRandomUint256()
      playSound("tcm", "TRX_wait_a")
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
  }
</style>
