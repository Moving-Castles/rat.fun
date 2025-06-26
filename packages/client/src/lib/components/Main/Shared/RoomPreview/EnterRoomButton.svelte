<script lang="ts">
  import type { Hex } from "viem"
  import { playSound } from "$lib/modules/sound"

  import BigButton from "$lib/components/Main/Shared/Buttons/BigButton.svelte"

  let { roomId }: { roomId: Hex } = $props()

  const sendEnterRoom = () => {
    playSound("tcm", "enteredPod")
  }
</script>

<a href="/{roomId}/enter" class="room-enter">
  <BigButton text="Send rat to room" onclick={sendEnterRoom} />
</a>
