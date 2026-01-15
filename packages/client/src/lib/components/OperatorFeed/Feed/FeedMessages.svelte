<script lang="ts">
  import { tick, onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { publicNetwork } from "$lib/modules/network"
  import {
    visibleMessages,
    hasMoreMessages,
    loadMoreMessages,
    oldestMessage,
    isPaginationLoading,
    hasReachedHistoryLimit
  } from "../state.svelte"
  import FeedMessage from "./FeedMessage.svelte"
  import type { FeedMessage as FeedMessageType } from "./types"
  import { createLogger } from "$lib/modules/logger"
  import { loadMoreFeedHistory } from "$lib/modules/content"
  import { environment } from "$lib/modules/network"

  const logger = createLogger("[FeedMessages]")

  let scrollContainer = $state<HTMLDivElement | null>(null)
  let isAtBottom = $state(true)
  let hasUnseenMessages = $state(false)
  let previousMessageCount = $state(0)
  let isLoadingMore = $state(false)
  let hasInitiallyScrolled = $state(false)

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
    if (isNearTop() && !isLoadingMore && !$isPaginationLoading && !$hasReachedHistoryLimit) {
      isLoadingMore = true

      // Check if we need to fetch from Sanity or just increase display count
      const needsMoreData = !$hasMoreMessages
      const hasOldestData = $oldestMessage !== null

      if (needsMoreData && hasOldestData) {
        // Fetch older messages from Sanity
        isPaginationLoading.set(true)

        // Save current scroll position
        const previousScrollHeight = scrollContainer?.scrollHeight || 0

        try {
          const loadedCount = await loadMoreFeedHistory(
            $publicNetwork.worldAddress,
            $oldestMessage!.timestamp,
            $oldestMessage!.id
          )

          if (loadedCount === 0) {
            // No more history available
            logger.log("No more feed history available")
          } else {
            logger.log(`Loaded ${loadedCount} older messages from Sanity`)
            // Increase display count to show the new messages
            loadMoreMessages()
          }
        } catch (error) {
          logger.error("Error fetching older messages:", error)
        } finally {
          isPaginationLoading.set(false)

          // Wait for DOM to update, then restore scroll position
          await tick()
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight
            const heightDifference = newScrollHeight - previousScrollHeight
            scrollContainer.scrollTop += heightDifference
          }
        }
      } else if ($hasMoreMessages) {
        // Just show more of what we already have loaded
        const previousScrollHeight = scrollContainer?.scrollHeight || 0

        loadMoreMessages()

        // Wait for DOM to update, then restore scroll position
        await tick()
        if (scrollContainer) {
          const newScrollHeight = scrollContainer.scrollHeight
          const heightDifference = newScrollHeight - previousScrollHeight
          scrollContainer.scrollTop += heightDifference
        }
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

  // Initial scroll to bottom on mount (run only once)
  $effect(() => {
    if (scrollContainer && $visibleMessages.length > 0 && !hasInitiallyScrolled) {
      hasInitiallyScrolled = true
      tick().then(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      })
    }
  })

  const onClickMessage = (message: FeedMessageType) => {
    logger.log("msg, ", message)
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

  onDestroy(() => {
    logger.log("onDestroy called")
  })
</script>

<div class="feed-messages" bind:this={scrollContainer} onscroll={handleScroll}>
  {#if $visibleMessages.length === 0}
    <div class="empty-state">
      <span>No messages yet</span>
    </div>
  {:else}
    <div class="messages-list" in:fade={{ duration: 300 }}>
      {#if $hasMoreMessages || (!$hasReachedHistoryLimit && $oldestMessage)}
        <div class="load-more-indicator">
          {#if $isPaginationLoading || isLoadingMore}
            <span>Loading older messages...</span>
          {:else if $hasReachedHistoryLimit}
            <span>Reached 1 week history limit</span>
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
