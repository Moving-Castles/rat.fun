<script lang="ts">
  import { gameConfig, rat } from "$lib/modules/state/stores"
  import { latestEventsOnRatLevel } from "$lib/modules/off-chain-sync/stores"
  import { sendChatMessage } from "$lib/modules/off-chain-sync"
  import { websocketConnected } from "$lib/modules/off-chain-sync/stores"
  import { onMount } from "svelte"
  import { typeHit } from "$lib/modules/sound"
  import { CharacterLimitError, ChatValidationError } from "$lib/modules/error-handling/errors"

  import ChatHeader from "./ChatHeader.svelte"
  import ChatEvent_RoomCreation from "./ChatEvent/ChatEvent_RoomCreation.svelte"
  import ChatEvent_RoomLiquidation from "./ChatEvent/ChatEvent_RoomLiquidation.svelte"
  import ChatEvent_RoomOutcome from "./ChatEvent/ChatEvent_RoomOutcome.svelte"
  import ChatEvent_RatDeath from "./ChatEvent/ChatEvent_RatDeath.svelte"
  import ChatEvent_RatDeploy from "./ChatEvent/ChatEvent_RatDeploy.svelte"
  import ChatEvent_RatLiquidate from "./ChatEvent/ChatEvent_RatLiquidate.svelte"
  import ChatEvent_KeyActivation from "./ChatEvent/ChatEvent_KeyActivation.svelte"
  import ChatEvent_ChatMessage from "./ChatEvent/ChatEvent_ChatMessage.svelte"

  let value = $state("")
  let scrollElement = $state<null | HTMLElement>(null)
  let suppressSound = $state(true)
  let inputElement = $state<HTMLInputElement | null>(null)

  onMount(() => {
    // Suppress sounds for the first 2 seconds
    setTimeout(() => {
      suppressSound = false
    }, 2000)
  })

  $effect(() => {
    if ($latestEventsOnRatLevel && scrollElement) {
      scrollElement.scrollTop = scrollElement?.scrollHeight ?? 0
    }
  })

  const sendMessage = async (e: Event) => {
    e.preventDefault()

    try {
      // Validate message is not empty
      if (!value || value.trim() === "") {
        throw new ChatValidationError("Message cannot be empty", value)
      }

      // Validate message length
      if (value.length > 500) {
        throw new CharacterLimitError(value.length, 500, "chat message")
      }

      // Level of the player's rat, or the first level if the rat is not deployed
      const level = $rat?.level ?? $gameConfig?.levelList[0] ?? "unknown level"
      await sendChatMessage(level, value)
      value = ""
    } catch (error) {
      // Validation errors are handled silently in the UI
      // Other errors will be thrown by sendChatMessage if needed
    }
  }
</script>

<div class="chat-box">
  <ChatHeader />
  <!-- Chat scroll -->
  <div bind:this={scrollElement} class="chat-scroll">
    {#each $latestEventsOnRatLevel as event (event.id)}
      {#if event.topic == "room__creation"}
        <ChatEvent_RoomCreation {event} {suppressSound} />
      {:else if event.topic == "room__liquidation"}
        <ChatEvent_RoomLiquidation {event} {suppressSound} />
      {:else if event.topic == "room__outcome"}
        <ChatEvent_RoomOutcome {event} {suppressSound} />
      {:else if event.topic == "rat__death"}
        <ChatEvent_RatDeath {event} {suppressSound} />
      {:else if event.topic == "rat__deploy"}
        <ChatEvent_RatDeploy {event} {suppressSound} />
      {:else if event.topic == "rat__liquidate"}
        <ChatEvent_RatLiquidate {event} {suppressSound} />
      {:else if event.topic == "key__activation"}
        <ChatEvent_KeyActivation {event} {suppressSound} />
      {:else if event.topic == "chat__message"}
        <ChatEvent_ChatMessage {event} {suppressSound} />
      {/if}
    {/each}
  </div>
  <!-- Chat input container -->
  <div class="chat-input-container">
    <!-- Chat input -->
    <input
      bind:this={inputElement}
      oninput={typeHit}
      bind:value
      class="chat-input"
      type="text"
      name="text"
      id="text"
      onkeydown={e => e.key === "Enter" && sendMessage(e)}
    />
    <!-- Chat submit -->
    <input
      disabled={!$websocketConnected || value === ""}
      class="chat-submit"
      type="button"
      value="Send"
      onclick={sendMessage}
    />
  </div>
</div>

<style lang="scss">
  .chat-box {
    height: 100%;
    display: flex;
    overflow: hidden;
    flex-flow: column nowrap;
    position: relative;
    background-color: var(--background-semi-transparent);
    background-image: url("/images/texture-3.png");
    background-size: 100px;
    border-top: var(--default-border-style);
    min-height: 100px;

    .chat-scroll {
      flex-flow: column nowrap;
      height: 100%;
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
      z-index: var(--z-high);
      width: 100%;
      padding: 10px;
      position: sticky;
      bottom: 0;

      .chat-submit {
        height: 100%;
        background: var(--color-alert);
        color: var(--white);
        border: var(--default-border-style);
        cursor: pointer;
        font-family: var(--typewriter-font-stack);
        width: 100px;
        height: 100%;
        color: var(--foreground);

        &:hover {
          background: var(--background);
        }
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
