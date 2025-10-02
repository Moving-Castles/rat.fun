<script lang="ts">
  import { Log } from "$lib/components/Room"
  import { onMount, onDestroy } from "svelte"
  import { playUISound } from "$lib/modules/sound/state.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let { onComplete, result } = $props()
  let sound = $state()

  onMount(() => {
    shaderManager.setShader("blank")
    sound = playUISound("ratfun", "tripResultLoopv2")
    playUISound("ratfun", "tripResultTrigger")
  })

  onDestroy(async () => {
    const result = await sound
    if (result) {
      result.stop()
    }
  })
</script>

<!-- LOG -->
<Log {result} {onComplete} />

<style lang="scss">
</style>
