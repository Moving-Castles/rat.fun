<script lang="ts">
  import { tick } from "svelte"
  import { fade } from "svelte/transition"
  import { visibleMessages, hasMoreMessages, loadMoreMessages } from "../state.svelte"
  import FeedMessage from "./FeedMessage.svelte"
  import type { FeedMessage as FeedMessageType } from "./types"

  let scrollContainer = $state<HTMLDivElement | null>(null)
  let isAtBottom = $state(true)
  let hasUnseenMessages = $state(false)
  let previousMessageCount = $state(0)
  let isLoadingMore = $state(false)

  // Check if user is near bottom of scroll
  function isNearBottom(): boolean {
    if (!scrollContainer) return true
    const threshold = 50 // pixels from bottom
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    return scrollHeight - scrollTop - clientHeight < threshold
  }

  // Check if user is near top of scroll
  function isNearTop(): boolean {
    if (!scrollContainer) return false
    const threshold = 100 // pixels from top
    return scrollContainer.scrollTop < threshold
  }

  // Handle scroll events to detect user scrolling up
  async function handleScroll() {
    const atBottom = isNearBottom()
    isAtBottom = atBottom
    // Clear unseen messages when user scrolls to bottom
    if (atBottom) {
      hasUnseenMessages = false
    }

    // Load more messages when scrolling near the top
    if (isNearTop() && $hasMoreMessages && !isLoadingMore) {
      isLoadingMore = true
      // Save current scroll position
      const previousScrollHeight = scrollContainer?.scrollHeight || 0

      // Load more messages
      loadMoreMessages()

      // Wait for DOM to update, then restore scroll position
      await tick()
      if (scrollContainer) {
        const newScrollHeight = scrollContainer.scrollHeight
        const heightDifference = newScrollHeight - previousScrollHeight
        scrollContainer.scrollTop += heightDifference
      }

      isLoadingMore = false
    }
  }

  // Auto-scroll when new messages arrive (only if already at bottom)
  $effect(() => {
    const currentCount = $visibleMessages.length
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
    if (scrollContainer && $visibleMessages.length > 0) {
      tick().then(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      })
    }
  })

  const onClickMessage = (message: FeedMessageType) => {
    console.log("msg, ", message)
  }

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
  {#if $visibleMessages.length === 0}
    <div class="empty-state">
      <span>No messages yet</span>
    </div>
  {:else}
    <div class="messages-list" in:fade|global={{ duration: 300 }}>
      {#if $hasMoreMessages}
        <div class="load-more-indicator">
          {#if isLoadingMore}
            <span>Loading...</span>
          {:else}
            <span>Scroll up to load more</span>
          {/if}
        </div>
      {/if}
      {#each $visibleMessages as message (message.id)}
        <FeedMessage onclick={() => onClickMessage(message)} {message} />
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

  .load-more-indicator {
    display: flex;
    justify-content: center;
    padding: 12px;
    opacity: 0.6;
    font-size: var(--font-size-small);
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
