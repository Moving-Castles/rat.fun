<script lang="ts">
  import ChatEvent from "../ChatEvent/ChatEvent.svelte"
  import { latestEvents } from "@modules/off-chain-sync/stores"
  import { walletNetwork } from "@modules/network"
  import { sendChatMessage } from "@modules/off-chain-sync"
  import { websocketConnected } from "@modules/off-chain-sync/stores"

  let clientHeight = $state(0)
  let value = $state("")
  let scrollElement = $state<null | HTMLElement>(null)

  $effect(() => {
    if ($latestEvents[$latestEvents.length - 1] && scrollElement) {
      scrollElement.scrollTop = scrollElement?.scrollHeight ?? 0
    }
  })

  const sendMessage = async e => {
    console.log("yeah")

    e.preventDefault()

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
  <div bind:this={scrollElement} class="chat-scroll">
    {#each $latestEvents as event (event.timestamp)}
      <ChatEvent {event} />
    {/each}
  </div>
  <form autocomplete="off" class="chat-input" onsubmit={sendMessage}>
    <input bind:value class="chat-message" type="text" name="text" id="text" />

    <div class="status">
      <div class="indicator" class:connected={$websocketConnected} />
    </div>
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

    .chat-scroll {
      display: flex;
      flex-flow: column nowrap;
      height: calc(var(--game-window-height) - 80px - 444px);
      overflow-y: scroll;
      padding: 8px;
      gap: 8px;
    }

    input[disabled] {
      background: grey;
    }

    .chat-input {
      height: 40px;
      display: flex;
      flex-flow: row nowrap;
      color: white;
      bottom: 0;
      z-index: 1000;
      width: 100%;

      .chat-submit {
        height: 100%;
        background: var(--color-alert);
        color: var(--white);
      }

      .status {
        height: 100%;
        aspect-ratio: 1;
        background: var(--black);
        display: flex;
        justify-content: center;
        align-items: center;

        .indicator {
          width: 10px;
          height: 10px;
          border-radius: 100%;
          background: var(--color-death);

          &.connected {
            background: var(--color-health);
          }
        }
      }

      .chat-message {
        height: 100%;
        width: 100%;
        font-family: var(--typewriter-font-stack);
        color: white;
        background-color: var(--black);
      }

      .chat-submit {
        font-family: var(--typewriter-font-stack);
        width: 100px;
        height: 100%;
        color: white;
      }
    }
  }
</style>
