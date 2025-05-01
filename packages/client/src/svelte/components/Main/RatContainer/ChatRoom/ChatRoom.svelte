<script lang="ts">
  import { latestEvents } from "@modules/off-chain-sync/stores"

  const sendMessage = e => {
    e.preventDefault()

    console.log()
  }
</script>

<div class="chat-window">
  <div class="chat-scroll">
    {#each $latestEvents as event}
      {event.topic}: {event.message}
    {/each}
  </div>
  <form autocomplete="off" class="chat-input" onsubmit={sendMessage}>
    <input class="chat-message" type="text" name="text" id="text" />
    <input class="chat-submit" type="submit" value="Send" />
  </form>
</div>

<style lang="scss">
  .chat-window {
    height: 100%;
    display: flex;
    flex-flow: column nowrap;

    .chat-scroll {
      height: 100%;
    }

    .chat-input {
      height: 40px;
      display: flex;
      flex-flow: row nowrap;
      color: white;

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
