<script lang="ts">
  import { onMount } from "svelte"
  import { getQueryClientContext } from "@tanstack/svelte-query"
  import { player } from "$lib/modules/state/stores"
  import { sendLiquidateRat } from "$lib/modules/action-manager/index.svelte"
  import { sendLiquidateRatMessage } from "$lib/modules/off-chain-sync"
  import { VideoLoaderDuration } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../RatBox/state.svelte"

  const queryClient = getQueryClientContext()

  onMount(async () => {
    await sendLiquidateRat(queryClient)
    sendLiquidateRatMessage($player.currentRat)
    // RAT_BOX_STATE.LIQUIDATING_RAT -> RAT_BOX_STATE.DEAD_RAT
    transitionTo(RAT_BOX_STATE.DEAD_RAT)
  })
</script>

<VideoLoaderDuration duration={4000} />
