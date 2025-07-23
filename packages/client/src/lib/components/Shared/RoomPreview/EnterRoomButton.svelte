<script lang="ts">
  import type { Hex } from "viem"
  import { playSound } from "$lib/modules/sound"
  import { sessionId } from "$lib/modules/session/state.svelte"
  import { goto } from "$app/navigation"
  import { v4 as uuid } from "uuid"

  import { BigButton } from "$lib/components/Shared"

  let { roomId }: { roomId: Hex } = $props()

  const onClick = async () => {
    sessionId.set(uuid())
    playSound("tcm", "enteredPod")
    goto(`/${roomId}/enter?sessionId=${$sessionId}`)
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
