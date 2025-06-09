<script lang="ts">
  import type { Hex } from "viem"

  import { rat } from "@modules/state/base/stores"
  import { playSound } from "@modules/sound"
  import { getUIState } from "@modules/ui/state.svelte"

  let { roomId }: { roomId: Hex } = $props()

  let { rooms } = getUIState()

  const sendEnterRoom = () => {
    playSound("tcm", "enteredPod")
    rooms.navigate("room", { roomId })
  }
</script>

<div class="room-enter">
  <button onclick={sendEnterRoom}>Send rat to room</button>
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
