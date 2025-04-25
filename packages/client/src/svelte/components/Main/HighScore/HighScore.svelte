<script lang="ts">
  import { HighScoreModalActive } from "@modules/ui/stores"
  import { players } from "@modules/state/base/stores"
  import { fade } from "svelte/transition"
  import HighScoreItem from "@components/Main/HighScore/HighScoreItem.svelte"
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="highcore"
  onclick={() => HighScoreModalActive.set(false)}
  in:fade={{ duration: 200 }}
>
  <div class="inner">
    <div class="highscore-list">
      {#each Object.entries($players).sort(([, a], [, b]) => {
        if (b.balance > a.balance) return 1
        if (b.balance < a.balance) return -1
        return 0
      }) as [id, player], index}
        <HighScoreItem {id} {player} {index} />
      {/each}
    </div>
  </div>
</div>

<style>
  .highcore {
    width: var(--game-window-width);
    height: var(--game-window-height);
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.8);

    .inner {
      width: 500px;
      min-height: 500px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 20px;
      background: black;
      border: 1px solid white;
    }
  }
</style>
