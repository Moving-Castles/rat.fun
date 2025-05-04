<script lang="ts">
  import { latestEvents } from "@modules/off-chain-sync/stores"
  import { walletNetwork } from "@modules/network"
  import { sendChatMessage } from "@modules/off-chain-sync"
  import { websocketConnected } from "@modules/off-chain-sync/stores"

  import ChatEvent from "./ChatEvent.svelte"
  import ChatMessage from "./ChatMessage.svelte"
  import ChatHeader from "./ChatHeader.svelte"

  let clientHeight = $state(0)
  let value = $state("")
  let scrollElement = $state<null | HTMLElement>(null)

  $effect(() => {
    if ($latestEvents && scrollElement) {
      scrollElement.scrollTop = scrollElement?.scrollHeight ?? 0
    }
  })

  const sendMessage = async (e: Event) => {
    e.preventDefault()
    // Limit message length to 500 characters
    if (!value || value.length > 500) return
    try {
      await sendChatMessage($walletNetwork, value)
      value = ""
    } catch (e) {
      console.error(e)
    }
  }
</script>

<div bind:clientHeight class="chat-window">
  <ChatHeader />
  <!-- Chat scroll -->
  <div bind:this={scrollElement} class="chat-scroll">
    {#each $latestEvents as event (event.id)}
      {#if event.topic == "chat__message"}
        <ChatMessage {event} />
      {:else}
        <ChatEvent {event} />
      {/if}
    {/each}
  </div>
  <!-- Chat input container -->
  <form autocomplete="off" class="chat-input-container" onsubmit={sendMessage}>
    <!-- Chat input -->
    <input bind:value class="chat-input" type="text" name="text" id="text" />
    <!-- Chat submit -->
    <input
      disabled={!$websocketConnected || value === ""}
      class="chat-submit"
      type="submit"
      value="Send"
    />
  </form>
</div>

<style lang="scss">
  .chat-window {
    height: calc(var(--game-window-height) - 80px - 440px);
    display: flex;
    flex-flow: column nowrap;
    position: relative;
    background: url("/images/bg-test.jpg");
    background-size: 100px;
    border-top: double 2px var(--foreground);

    .chat-scroll {
      display: flex;
      flex-flow: column nowrap;
      height: calc(var(--game-window-height) - 80px - 504px);
      overflow-y: scroll;
      padding: 8px;
      gap: 4px;
    }

    input[disabled] {
      background: var(--color-grey-mid);
    }

    .chat-input-container {
      height: 60px;
      display: flex;
      flex-flow: row nowrap;
      color: var(--foreground);
      bottom: 0;
      z-index: 1000;
      width: 100%;
      padding: 10px;

      .chat-submit {
        height: 100%;
        background: var(--color-alert);
        color: var(--white);
        border: var(--default-border-style);
        cursor: pointer;

        &:hover {
          background: var(--background);
        }
      }

      .chat-submit {
        font-family: var(--typewriter-font-stack);
        width: 100px;
        height: 100%;
        color: var(--foreground);
      }

      .chat-input {
        height: 100%;
        width: 100%;
        font-family: var(--typewriter-font-stack);
        color: var(--foreground);
        background-color: var(--color-grey-dark);
        border: var(--dashed-border-style);
        margin-right: 10px;

        &:focus {
          outline: none;
          background: var(--color-grey-light);
          color: var(--background);
        }
      }
    }
  }
</style>
