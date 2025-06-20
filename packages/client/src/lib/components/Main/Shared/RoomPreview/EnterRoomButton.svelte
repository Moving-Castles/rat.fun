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

<style lang="scss">
  .room-enter {
    height: 80px;
    user-select: none;
    overflow: hidden;
    display: block;

    :global(button) {
      width: 100%;
      height: 100%;
      background: var(--color-alert-priority);
      border: none;
      font-family: var(--label-font-stack);
      font-size: var(--font-size-extra-large);
      transition: transform 0.2s ease-in-out;
      letter-spacing: -0.2em;

    }
    &:hover {
      background: var(--color-alert-priority);
      color: var(--background);

      :global(button) {
        transform: scale(1.3);
      }
    }
  }
</style>
