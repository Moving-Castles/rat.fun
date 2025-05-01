<script lang="ts">
  import YourRat from "@components/Main/RatContainer/YourRat/YourRat.svelte"
  import ChatRoom from "@components/Main/RatContainer/ChatRoom/ChatRoom.svelte"
</script>

<div class="rat-container">
  <YourRat />
  <ChatRoom />
</div>

<style lang="scss">
  .rat-container {
    width: calc(50% - (var(--floor-bar-width) / 2));
    border-bottom: var(--default-border-style);
  }
</style>
