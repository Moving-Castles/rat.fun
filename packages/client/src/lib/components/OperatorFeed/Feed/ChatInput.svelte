<script lang="ts">
  import { onMount, tick } from "svelte"
  import { SmallButton } from "$lib/components/Shared"
  import { sendChatMessage } from "$lib/modules/off-chain-sync/chat"
  import { playSound } from "$lib/modules/sound"
  import { isPhone } from "$lib/modules/ui/state.svelte"

  const MAX_LENGTH = 280

  let message = $state("")
  let isSending = $state(false)
  let inputElement = $state<HTMLInputElement | null>(null)

  const isOverLimit = $derived(message.length > MAX_LENGTH)

  onMount(() => {
    if (!$isPhone) {
      inputElement?.focus()
    }
  })

  async function handleSend() {
    const trimmed = message.trim()
    if (!trimmed || isSending || trimmed.length > MAX_LENGTH) return

    isSending = true
    try {
      await sendChatMessage(trimmed)
      message = ""
      playSound({ category: "ratfunUI", id: "click" })
    } catch (error) {
      console.error("Failed to send message:", error)
      playSound({ category: "ratfunUI", id: "error" })
    } finally {
      isSending = false
      await tick()
      inputElement?.focus()
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }
</script>

<div class="chat-input">
  <input
    bind:this={inputElement}
    bind:value={message}
    onkeydown={handleKeydown}
    placeholder="Type a message..."
    disabled={isSending}
    class:over-limit={isOverLimit}
  />
  <div class="send-button">
    <SmallButton
      text={isSending ? "..." : "Send"}
      onclick={handleSend}
      disabled={isSending || !message.trim() || isOverLimit}
    />
  </div>
</div>

<style lang="scss">
  .chat-input {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 20px 16px;
    border-top: var(--default-border-style);
    background: var(--background);

    @media (max-width: 800px) {
      padding: 16px 12px;
    }
  }

  input {
    flex: 1;
    background: var(--color-grey-darker);
    border: 1px solid var(--color-grey-mid);
    color: var(--foreground);
    padding: 8px 12px;
    font-size: var(--font-size-normal);
    font-family: inherit;

    &::placeholder {
      color: var(--color-grey-light);
    }

    &:focus {
      outline: none;
      border-color: var(--foreground);
    }

    &:disabled {
      opacity: 0.5;
    }

    &.over-limit {
      border-color: var(--color-down);
      background: rgba(255, 0, 0, 0.1);
    }
  }

  .send-button {
    width: 35%;
    height: 100%;
    flex-shrink: 0;
  }
</style>
