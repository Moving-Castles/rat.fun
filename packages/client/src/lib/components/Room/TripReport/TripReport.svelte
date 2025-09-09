<script lang="ts">
  import { Log } from "$lib/components/Room"
  import { onMount, onDestroy } from "svelte"
  import { playSound } from "$lib/modules/sound"

  let { onComplete, result } = $props()
  let sound = $state()

  onMount(() => {
    console.log("play result good")
    sound = playSound("ratfun", "tripResultGood")
  })

  onDestroy(() => {
    if (sound) {
      sound.stop()
    }
  })
</script>

<!-- LOG -->
<Log {result} {onComplete} />

<style lang="scss">
</style>
