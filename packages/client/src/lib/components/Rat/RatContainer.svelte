<script lang="ts">
  import { RatBox } from "$lib/components/Rat"
  import { ChatBox } from "$lib/components/Shared"

  let collapsed = $state<boolean>()
</script>

<div class="rat-container" class:collapsed>
  <RatBox />
  <ChatBox bind:collapsed />
</div>

<style lang="scss">
  .rat-container {
    height: calc(var(--game-window-height) - 60px);
    width: 100%;
    display: grid;
    grid-template-rows: 440px minmax(100px, 1fr);
    transition: grid-template-rows 0.1s ease;

    &.collapsed {
      grid-template-rows: calc(var(--game-window-height) - 89px) minmax(100px, 1fr);
    }
  }
</style>
