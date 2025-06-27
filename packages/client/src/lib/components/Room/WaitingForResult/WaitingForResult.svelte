<script lang="ts">
  import { VideoLoader } from "$lib/components/Shared"
</script>

<div class="waiting-for-result">
  <VideoLoader duration={11000} />
</div>

<style lang="scss">
  .waiting-for-result {
    margin-bottom: 20px;
    height: calc(var(--game-window-height) - 300px);
    border: var(--default-border-style);
    border-top: none;
    position: relative;
  }
</style>
