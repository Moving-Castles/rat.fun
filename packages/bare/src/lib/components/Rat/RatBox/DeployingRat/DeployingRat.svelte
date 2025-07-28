<script lang="ts">
  import { onMount } from "svelte"
  import { player } from "$lib/modules/state/stores"
  import { waitForPropertyChange } from "$lib/modules/state/utils"
  import { sendCreateRat } from "$lib/modules/action-manager/index.svelte"
  import { generateRatName } from "./ratNameGenerator"
  import { sendDeployRatMessage } from "$lib/modules/off-chain-sync"
  import { VideoLoaderDuration } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../state.svelte"
  import { PropertyChangeTimeoutError, RatError } from "$lib/modules/error-handling/errors"
  import { errorHandler } from "$lib/modules/error-handling"

  const name: string = generateRatName()

  onMount(async () => {
    const oldRatId = $player?.currentRat ?? ""
    await sendCreateRat(name)

    try {
      // Make sure new rat is available to avoid flash of old info
      await waitForPropertyChange(player, "currentRat", oldRatId, 10000)
      sendDeployRatMessage()
      transitionTo(RAT_BOX_STATE.HAS_RAT)
    } catch (error) {
      if (error instanceof PropertyChangeTimeoutError || error instanceof RatError) {
        errorHandler(error)
      }

      console.error("Timeout waiting for rat creation:", error)
    }
  })
</script>

<VideoLoaderDuration duration={4000} />
