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
  <!-- Min height of 20px -->
  <div class="spacer"></div>
  <!-- Fills rest of vertical space -->
  <ChatRoom />
</div>

<style lang="scss">
  .rat-container {
    height: var(--game-window-height);
    width: 100%;
    border-bottom: var(--default-border-style);
    display: grid;
    grid-template-rows: 60px 440px 1fr minmax(100px, 440px);
    position: relative;
    background: black;
  }

  .spacer {
    height: 100%;
    width: 100%;
    background-image: url("/images/texture2.jpg");
    background-size: 100px;
  }
</style>
