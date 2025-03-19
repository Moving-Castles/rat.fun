<script lang="ts">
  import { player } from "@modules/state/base/stores"
  import { ENVIRONMENT } from "@mud/enums"
  import type { SetupWalletNetworkResult } from "@mud/setupWalletNetwork"
  import { sendChat } from "./index"
  let chatActive = false
  let message = ""

  export let environment: ENVIRONMENT
  export let walletNetwork: SetupWalletNetworkResult

  let chatLog: string[] = []

  async function msgSend() {
    chatLog = [...chatLog, `>>>> ${message}`]
    const returnMessage = await sendChat(
      environment,
      walletNetwork,
      message,
      $player?.ownedRat
    )
    console.log(returnMessage)
    chatLog = [...chatLog, returnMessage ?? ""]
    message = ""
  }

  function toggleChat() {
    chatActive = !chatActive
  }
</script>

<button class="chat-button" on:click={toggleChat}>Chat</button>

{#if chatActive}
  <div class="chat">
    <div class="container">
      {#each chatLog as log}
        <div class="log">{log}</div>
      {/each}
      <input type="text" bind:value={message} />
      <button on:click={msgSend}>Send</button>
    </div>
  </div>
{/if}

<style lang="scss">
  .chat-button {
    position: fixed;
    bottom: 0;
    right: 0;
    background-color: var(--color-secondary);
    color: white;
    padding: 10px;
    cursor: pointer;
    z-index: 1000;
    font-size: 6px;
  }

  .chat {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--black);
    display: flex;
    justify-content: center;
    padding-top: 40px;
    z-index: 100;

    .container {
      width: 700px;
      max-width: 90vw;
      overflow-y: auto;
    }
  }

  .log {
    margin-bottom: 20px;
  }
</style>
