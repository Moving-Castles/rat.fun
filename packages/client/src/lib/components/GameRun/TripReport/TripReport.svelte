<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { Log, NormalResultSummary, RatDeadResultSummary } from "$lib/components/GameRun"
  import { playUISound } from "$lib/modules/sound/state.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import { RESULT_SUMMARY } from "$lib/components/GameRun/state.svelte"

  let { result }: { result: EnterRoomReturnValue | null } = $props()

  let sound = $state()
  let resultSummary = $state<RESULT_SUMMARY>(RESULT_SUMMARY.UNKNOWN)

  // Called after log output is complete
  const onComplete = () => {
    if (result?.ratDead) {
      resultSummary = RESULT_SUMMARY.RAT_DEAD
    } else {
      resultSummary = RESULT_SUMMARY.NORMAL
    }
  }

  onMount(() => {
    shaderManager.setShader("blank")
    sound = playUISound("ratfun", "tripResultLoop")
    playUISound("ratfun", "tripResultTrigger")
  })

  onDestroy(async () => {
    const resultSnd = await sound
    if (resultSnd) {
      resultSnd.stop()
    }
  })
</script>

<!-- LOG -->
<Log {result} {onComplete} />

<!-- RESULT SUMMARY -->
{#if resultSummary === RESULT_SUMMARY.NORMAL}
  <NormalResultSummary />
{:else if resultSummary === RESULT_SUMMARY.RAT_DEAD}
  <RatDeadResultSummary />
{/if}

<style lang="scss">
</style>
