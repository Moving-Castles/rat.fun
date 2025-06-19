<script lang="ts">
  import type { Hex } from "viem"
  import { playSound } from "$lib/modules/sound"
  import { getUIState } from "$lib/modules/ui/state.svelte"

  import BigButton from "$lib/components/Main/Shared/Buttons/BigButton.svelte"

  let { roomId }: { roomId: Hex } = $props()

  let { rooms } = getUIState()

  const sendEnterRoom = () => {
    playSound("tcm", "enteredPod")
    rooms.navigate("room", { roomId })
  }
</script>

<div class="room-enter">
  <BigButton text="Send rat to room" onclick={sendEnterRoom} />
</div>

<style lang="scss">
  .room-enter {
    height: 80px;
    user-select: none;
    overflow: hidden;

    button {
      width: 100%;
      height: 100%;
      background: var(--color-alert-priority);
      border: none;
      font-family: var(--label-font-stack);
      font-size: var(--font-size-extra-large);
      transition: transform 0.2s ease-in-out;
      letter-spacing: -0.2em;

      &:hover {
        background: var(--color-alert-priority);
        color: var(--background);
        transform: scale(1.3);
      }
    }
  }
</style>
