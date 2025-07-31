<script lang="ts">
  import { onMount } from "svelte"
  import { reAbsorbItem } from "$lib/modules/on-chain-transactions"
  import { playSound } from "$lib/modules/sound"
  import { VideoLoaderDuration } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE, getItemState } from "../state.svelte"

  let busy = $state(false)

  let { item } = getItemState()

  const sendReAbsorbItem = async () => {
    if (typeof item.current !== "string") {
      return
    }
    if (busy) return

    try {
      playSound("tcm", "blink")
      busy = true
      await reAbsorbItem(item.current)
      playSound("tcm", "TRX_no")
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
