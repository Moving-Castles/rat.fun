<script lang="ts">
  import type { Hex } from "viem"
  import { playUISound } from "$lib/modules/sound"
  import { player } from "$lib/modules/state/stores"
  import { goto } from "$app/navigation"
  import { BigButton } from "$lib/components/Shared"

  let { roomId, disabled }: { roomId: Hex; disabled: boolean } = $props()

  const onClick = async () => {
    playUISound("ratfun", "enteredPod")
    goto(`/${roomId}/result?enter=true&rat=${$player.currentRat}&t=${Date.now()}`)
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
