<script lang="ts">
  import type { Hex } from "viem"
  import { playSound } from "$lib/modules/sound"
  import { goto } from "$app/navigation"

  import { BigButton } from "$lib/components/Shared"

  let { roomId }: { roomId: Hex } = $props()

  const onClick = () => {
    playSound("tcm", "enteredPod")
    goto(`/${roomId}/enter`)
  }
</script>

<div class="room-enter">
  <BigButton text="Send rat to room" onclick={onClick} />
</div>

<style>
  .room-enter {
    display: block;
    height: 90px;
  }
</style>
