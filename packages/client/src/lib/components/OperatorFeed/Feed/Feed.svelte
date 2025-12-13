<script lang="ts">
  import FeedHeader from "./FeedHeader.svelte"
  import FeedMessages from "./FeedMessages.svelte"
  import ChatInput from "./ChatInput.svelte"
</script>

<div class="feed">
  <FeedHeader />
  <FeedMessages />
  <ChatInput />
</div>

<style lang="scss">
  .feed {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background);
  }
</style>
