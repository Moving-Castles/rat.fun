<script lang="ts">
  import { Log } from "$lib/components/Room"
  import { onMount, onDestroy } from "svelte"
  import { playUISound } from "$lib/modules/sound"

  let { onComplete, result } = $props()
  let sound = $state()

  onMount(() => {
    console.log("play result good")
    sound = playUISound("ratfun", "tripResultLoop")
    playUISound("ratfun", "tripResultTrigger")
  })

  onDestroy(async () => {
    const result = await sound
    if (result) {
      console.log("trying to stop sound ", result)
      result.stop()
    }
  })
</script>

<!-- LOG -->
<Log {result} {onComplete} />

<style lang="scss">
</style>
