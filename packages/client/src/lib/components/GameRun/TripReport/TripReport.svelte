<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { Log, NormalResultSummary, RatDeadResultSummary } from "$lib/components/GameRun"
  import { playSound } from "$lib/modules/sound"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import { RESULT_SUMMARY } from "$lib/components/GameRun/state.svelte"
  import { Howl } from "howler"

  let { result }: { result: EnterRoomReturnValue | null } = $props()

  let resultSummary = $state<RESULT_SUMMARY>(RESULT_SUMMARY.UNKNOWN)
  let backgroundMusic: Howl | undefined = $state()

  // Called after log output is complete
  const onComplete = () => {
    if (result?.ratDead) {
      resultSummary = RESULT_SUMMARY.RAT_DEAD
    } else {
      resultSummary = RESULT_SUMMARY.NORMAL
    }
  }

  onMount(() => {
    playSound("ratfunTransitions", "tripReportEnter")
    shaderManager.setShader("blank")
    backgroundMusic = playSound("ratfunMusic", "tripReport", true)
  })

  onDestroy(async () => {
    // Stop background music
    if (backgroundMusic) {
      backgroundMusic.stop()
      backgroundMusic = undefined
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
