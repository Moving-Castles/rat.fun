<script lang="ts">
  import { onMount, tick } from "svelte"
  import { CharacterCounter } from "$lib/components/Shared"
  import { sendChatMessage } from "$lib/modules/off-chain-sync/chat"
  import { playSound } from "$lib/modules/sound"

  const MAX_LENGTH = 280

  let message = $state("")
  let isSending = $state(false)
  let inputElement = $state<HTMLInputElement | null>(null)

  onMount(() => {
    inputElement?.focus()
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
    maxlength={MAX_LENGTH}
  />
  <div class="input-actions">
    <CharacterCounter currentLength={message.length} maxLength={MAX_LENGTH} />
    <button
      class="send-button"
      onclick={handleSend}
      disabled={isSending || !message.trim() || message.length > MAX_LENGTH}
    >
      {isSending ? "..." : "Send"}
    </button>
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
      padding: 8px 12px;
    }
  }

  input {
    flex: 1;
    background: var(--color-grey-darker);
    border: 1px solid var(--color-grey-mid);
    color: var(--foreground);
    padding: 8px 12px;
    font-size: var(--font-size-small);
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
  }

  .input-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .send-button {
    background: var(--foreground);
    color: var(--background);
    border: none;
    padding: 8px 16px;
    font-size: var(--font-size-small);
    cursor: pointer;
    text-transform: uppercase;
    font-family: var(--special-font-stack);

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }
</style>
