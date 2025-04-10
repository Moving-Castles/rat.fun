<script lang="ts">
  import { fade } from "svelte/transition"
  import { newEvent } from "@modules/off-chain-sync/stores"
  import type { MessageContent } from "@svelte/modules/off-chain-sync/types"
  import { playSound } from "@modules/sound"

  $effect(() => {
    console.log("newEvent", $newEvent)
    if ($newEvent) {
      setLocalMessage($newEvent)
    }
  })

  let localMessage = $state<MessageContent | null>(null)

  const setLocalMessage = (event: MessageContent) => {
    playSound("tcm", "alert")
    console.log("setLocalMessage", event)
    localMessage = event
    setTimeout(() => {
      localMessage = null
    }, 3000)
  }
</script>

{#if localMessage}
  <div class="alert" transition:fade={{ duration: 400 }}>
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
    border-left: 1px solid white;
    font-size: var(--font-size-small);
    color: black;
  }
</style>
