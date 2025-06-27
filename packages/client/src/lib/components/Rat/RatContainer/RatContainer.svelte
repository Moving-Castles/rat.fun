<script lang="ts">
  import { YourRat } from "$lib/components/Rat"
  import { ChatRoom } from "$lib/components/Shared"
</script>

<div class="rat-container">
  <YourRat />
  <div class="spacer"></div>
  <div class="remaining">
    <ChatRoom />
  </div>
</div>

<style lang="scss">
  .rat-container {
    height: calc(var(--game-window-height) - 60px);
    width: 100%;
    border-bottom: var(--default-border-style);
    display: grid;
    grid-template-rows: 440px 40px minmax(100px, 1fr);
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
