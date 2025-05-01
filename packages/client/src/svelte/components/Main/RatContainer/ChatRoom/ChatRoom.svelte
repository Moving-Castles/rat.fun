<script lang="ts">
  import { latestEvents } from "@modules/off-chain-sync/stores"
  import { walletNetwork } from "@modules/network"
  import { sendChatMessage } from "@modules/off-chain-sync"
  import { websocketConnected } from "@modules/off-chain-sync/stores"
  import { timeSince } from "@modules/utils"

  let clientHeight = $state(0)
  let value = $state("")
  let scrollElement = $state<null | HTMLElement>(null)

  $effect(() => {
    if ($latestEvents[$latestEvents.length - 1]) {
      scrollElement.scrollTop = scrollElement.scrollHeight
    }
  })

  const sendMessage = async e => {
    console.log("yeah")
    e.preventDefault()

    try {
      await sendChatMessage($walletNetwork, value)
      console.log("we send")
      value = ""
    } catch (e) {
      console.error(e)
    }
  }
</script>

<div bind:clientHeight class="chat-window">
  <div bind:this={scrollElement} class="chat-scroll">
    {#each $latestEvents as event (event.message.timestamp)}
      {#if event.topic === "chat__message"}
        <div class="event message">
          <span class="timestamp">
            {event.message.timestamp}
          </span>{event.message.playerName}: {event.message.message}
        </div>
      {:else}
        <div class="event {event.topic}">
          {event.message.message}
        </div>
      {/if}
    {/each}
  </div>
  <form autocomplete="off" class="chat-input" onsubmit={sendMessage}>
    <input bind:value class="chat-message" type="text" name="text" id="text" />

    <div class="status">
      <div class="indicator" class:connected={$websocketConnected} />
    </div>
    <input
      disabled={!$websocketConnected}
      class="chat-submit"
      type="submit"
      value="Send"
    />
  </form>
</div>

<style lang="scss">
  .chat-window {
    height: 100%;
    display: flex;
    flex-flow: column nowrap;

    .chat-scroll {
      height: 300px;
      overflow-y: scroll;
      padding: 4px;

      .event {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        justify-content: start;
        gap: 4px;

        .timestamp {
          background: var(--color-grey-light);
          padding: 5px;
          color: black;
        }
      }
    }

    .chat-input {
      height: 40px;
      display: flex;
      flex-flow: row nowrap;
      color: white;

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
