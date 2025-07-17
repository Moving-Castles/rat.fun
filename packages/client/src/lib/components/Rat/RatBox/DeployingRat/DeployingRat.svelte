<script lang="ts">
  import { onMount } from "svelte"
  import { sendCreateRat } from "$lib/modules/action-manager/index.svelte"
  import { generateRatName } from "./ratNameGenerator"
  import { sendDeployRatMessage } from "$lib/modules/off-chain-sync"
  import { VideoLoaderDuration } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../state.svelte"

  const name: string = generateRatName()

  onMount(async () => {
    await sendCreateRat(name)
    sendDeployRatMessage()
    // RAT_BOX_STATE.DEPLOYING_RAT -> RAT_BOX_STATE.HAS_RAT
    transitionTo(RAT_BOX_STATE.HAS_RAT)
  })
</script>

<VideoLoaderDuration duration={4000} />
