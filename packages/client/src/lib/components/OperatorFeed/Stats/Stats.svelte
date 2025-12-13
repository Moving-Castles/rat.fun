<script lang="ts">
  import Leaderboard from "./Leaderboard.svelte"
</script>

<div class="stats">
  <div class="stats-header">
    <span class="title">Leaderboard</span>
  </div>
  <Leaderboard />
</div>

<style lang="scss">
  .stats {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background);
  }

  .stats-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: var(--default-border-style);
    background: var(--background);

    @media (max-width: 800px) {
      padding: 8px 12px;
    }
  }

  .title {
    font-family: var(--special-font-stack);
    font-size: var(--font-size-normal);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
