<script lang="ts">
  import { onMount } from "svelte"
  import { player } from "$lib/modules/state/stores"
  import { sendLiquidateRat } from "$lib/modules/action-manager/index.svelte"
  import { sendLiquidateRatMessage } from "$lib/modules/off-chain-sync"
  import { VideoLoaderDuration } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../state.svelte"

  onMount(async () => {
    await sendLiquidateRat()
    sendLiquidateRatMessage($player.currentRat)
    // RAT_BOX_STATE.LIQUIDATING_RAT -> RAT_BOX_STATE.DEAD_RAT
    transitionTo(RAT_BOX_STATE.DEAD_RAT)
  })
</script>

<VideoLoaderDuration duration={4000} />
