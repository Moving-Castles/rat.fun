<script lang="ts">
  import OperatorBar from "@components/Main/OperatorBar/OperatorBar.svelte"
  import YourRat from "@components/Main/RatContainer/YourRat/YourRat.svelte"
  import ChatRoom from "@components/Main/RatContainer/ChatRoom/ChatRoom.svelte"
</script>

<div class="rat-container">
  <!-- Fixed height of 60px -->
  <OperatorBar />
  <!-- Fixed height of 440px -->
  <YourRat />
  <!-- Fills rest of vertical space -->
  <ChatRoom />
</div>

<style lang="scss">
  .rat-container {
    height: 100%;
    width: 100%;
    border-bottom: var(--default-border-style);
    display: grid;
    grid-template-rows: 60px 440px 1fr;
    position: relative;
  }
</style>
