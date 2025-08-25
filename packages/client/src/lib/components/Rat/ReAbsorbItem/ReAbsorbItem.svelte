<script lang="ts">
  import { onMount } from "svelte"
  import { getQueryClientContext } from "@tanstack/svelte-query"
  import { reAbsorbItem } from "$lib/modules/on-chain-transactions"
  import { playSound } from "$lib/modules/sound"
  import { VideoLoaderDuration } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE, getItemState } from "../RatBox/state.svelte"

  let busy = $state(false)

  let { item } = getItemState()

  const queryClient = getQueryClientContext()

  const sendReAbsorbItem = async () => {
    if (typeof item.current !== "string") {
      return
    }
    if (busy) return

    try {
      playSound("ratfun", "blink")
      busy = true
      await reAbsorbItem(queryClient, item.current)
      playSound("ratfun", "TRX_no")
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }

  onMount(async () => {
    await sendReAbsorbItem()
    item.set("")
    transitionTo(RAT_BOX_STATE.HAS_RAT)
  })
</script>

<VideoLoaderDuration duration={4000} />
