<script lang="ts">
  import { fade } from "svelte/transition"
  import { newEvent } from "@modules/off-chain-sync/stores"
  import type { MessageContent } from "@modules/off-chain-sync/types"
  import { playSound } from "@modules/sound"

  $effect(() => {
    if ($newEvent) {
      setLocalMessage($newEvent)
    }
  })

  let localMessage = $state<MessageContent | null>(null)

  const setLocalMessage = (event: MessageContent) => {
    playSound("tcm", "alert")
    localMessage = event
    setTimeout(() => {
      localMessage = null
    }, 3000)
  }
</script>

{#if localMessage}
  <div
    class="alert"
    class:death={localMessage.topic == "rat__death"}
    transition:fade={{ duration: 400 }}
  >
    <div class="alert-message">{localMessage.message}</div>
  </div>
{/if}

<style lang="scss">
  .alert {
    height: 100%;
    width: 100%;
    background-color: var(--color-alert);
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: var(--default-border-style);
    font-size: var(--font-size-very-small);
    color: black;

    &.death {
      background-color: var(--color-death);
    }
  }
</style>
