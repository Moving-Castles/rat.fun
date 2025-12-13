<script lang="ts">
  import { tick } from "svelte"
  import { fade } from "svelte/transition"
  import { filteredMessages } from "../state.svelte"
  import FeedMessage from "./FeedMessage.svelte"

  let scrollContainer = $state<HTMLDivElement | null>(null)
  let isAtBottom = $state(true)
  let hasUnseenMessages = $state(false)
  let previousMessageCount = $state(0)

  // Check if user is near bottom of scroll
  function isNearBottom(): boolean {
    if (!scrollContainer) return true
    const threshold = 50 // pixels from bottom
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    return scrollHeight - scrollTop - clientHeight < threshold
  }

  // Handle scroll events to detect user scrolling up
  function handleScroll() {
    const atBottom = isNearBottom()
    isAtBottom = atBottom
    // Clear unseen messages when user scrolls to bottom
    if (atBottom) {
      hasUnseenMessages = false
    }
  }

  // Auto-scroll when new messages arrive (only if already at bottom)
  $effect(() => {
    const currentCount = $filteredMessages.length
    if (currentCount > previousMessageCount) {
      if (isAtBottom) {
        tick().then(() => {
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: "smooth"
            })
          }
        })
      } else {
        // User is scrolled up, show notification
        hasUnseenMessages = true
      }
    }
    previousMessageCount = currentCount
  })

  // Initial scroll to bottom on mount
  $effect(() => {
    if (scrollContainer && $filteredMessages.length > 0) {
      tick().then(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      })
    }
  })

  function scrollToBottom() {
    hasUnseenMessages = false
    isAtBottom = true
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: "smooth"
      })
    }
  }
</script>

<div class="feed-messages" bind:this={scrollContainer} onscroll={handleScroll}>
  {#if $filteredMessages.length === 0}
    <div class="empty-state">
      <span>No messages yet</span>
    </div>
  {:else}
    <div class="messages-list" in:fade|global={{ duration: 300 }}>
      {#each $filteredMessages as message (message.id)}
        <FeedMessage {message} />
      {/each}
    </div>
  {/if}

  {#if hasUnseenMessages}
    <button class="scroll-to-bottom" onclick={scrollToBottom}> New messages </button>
  {/if}
</div>

<style lang="scss">
  .feed-messages {
    flex: 1;
    overflow-y: auto;
    position: relative;
    min-height: 0;
  }

  .messages-list {
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    opacity: 0.5;
    font-size: var(--font-size-small);
  }

  .scroll-to-bottom {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-good);
    color: var(--background);
    border: none;
    padding: 8px 16px;
    font-size: var(--font-size-small);
    cursor: pointer;
    z-index: var(--z-high);

    &:hover {
      opacity: 0.9;
    }
  }
</style>
