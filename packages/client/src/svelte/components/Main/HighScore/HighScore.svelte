<script lang="ts">
  import { players } from "@modules/state/base/stores"
  import HighScoreItem from "@components/Main/HighScore/HighScoreItem.svelte"
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="highscore-list">
  {#each Object.entries($players).sort(([, a], [, b]) => {
    if (b.balance > a.balance) return 1
    if (b.balance < a.balance) return -1
    return 0
  }) as [id, player], index}
    <HighScoreItem {id} {player} {index} />
  {/each}
</div>

<style>
  .highscore-list {
    width: 500px;
    min-height: 500px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 20px;
    background: black;
    border: 1px solid white;
  }
</style>
