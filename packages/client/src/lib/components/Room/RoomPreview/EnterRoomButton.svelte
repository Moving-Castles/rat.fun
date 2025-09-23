<script lang="ts">
  import type { Hex } from "viem"
  import { playUISound } from "$lib/modules/sound/state.svelte"
  import { getMixerState } from "$lib/modules/sound/state.svelte"
  import { player, ratTotalValue } from "$lib/modules/state/stores"
  import { goto } from "$app/navigation"
  import { BigButton } from "$lib/components/Shared"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let { roomId, room, disabled }: { roomId: Hex; room: Room; disabled: boolean } = $props()

  let mixer = getMixerState()

  const onClick = async () => {
    shaderManager.setShader("blank")
    // Duck
    // mixer.rampChannelVolume("music", -12, 0.5)
    // const id = "fill" + Math.ceil(Math.random() * 4)
    // playUISound("ratfun", id, undefined, () => {
    //   mixer.rampChannelVolume("music", 0, 0.5)
    // })
    await goto(`/${roomId}/result?enter=true&rat=${$player.currentRat}&t=${Date.now()}`)
  }
</script>

<div class="room-enter">
  {#if Number(room.minRatValueToEnter) > Number($ratTotalValue)}
    <BigButton
      disabled={true}
      text={`Rat value too low (at least ${Number(room.minRatValueToEnter)})`}
      onclick={onClick}
    />
  {/if}
  <BigButton id="send_rat" {disabled} text="Send rat to trip" onclick={onClick} />
</div>

<style>
  .room-enter {
    display: block;
    height: 100%;
    padding: 5px;
    width: 100%;
  }
</style>
