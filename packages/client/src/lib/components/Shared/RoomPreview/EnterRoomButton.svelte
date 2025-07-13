<script lang="ts">
  import type { Hex } from "viem"
  import { playSound } from "$lib/modules/sound"

  import { BigButton } from "$lib/components/Shared"

  let { roomId }: { roomId: Hex } = $props()

  const sendEnterRoom = () => {
    playSound("tcm", "enteredPod")
  }
</script>

<a href="/game/{roomId}/enter" class="room-enter">
  <BigButton text="Send rat to room" onclick={sendEnterRoom} />
</a>

<style>
  .room-enter {
    display: block;
    height: 90px;
  }
</style>
