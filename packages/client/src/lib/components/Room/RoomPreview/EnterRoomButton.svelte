<script lang="ts">
  import type { Hex } from "viem"
  import { playUISound } from "$lib/modules/sound/state.svelte"
  import { getMixerState } from "$lib/modules/sound/state.svelte"
  import { player } from "$lib/modules/state/stores"
  import { goto } from "$app/navigation"
  import { BigButton } from "$lib/components/Shared"

  let { roomId, disabled }: { roomId: Hex; disabled: boolean } = $props()

  const mixer = getMixerState()

  const onClick = async () => {
    // Duck
    mixer.setChannelVolume("music", -12)
    const id = "fill" + Math.floor(Math.random() * 4)
    playUISound("ratfun", id, null, () => {
      mixer.setChannelVolume("music", 0)
    })
    await goto(`/${roomId}/result?enter=true&rat=${$player.currentRat}&t=${Date.now()}`)
  }
</script>

<div class="room-enter">
  <BigButton {disabled} text="Send rat to trip" onclick={onClick} />
</div>

<style>
  .room-enter {
    display: block;
    height: 90px;
  }
</style>
