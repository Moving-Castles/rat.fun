<script lang="ts">
  import { fade } from "svelte/transition"
  import { frozenRat } from "$lib/components/Room/Trip/state.svelte"
  import { goto } from "$app/navigation"
</script>

<div transition:fade|global class="summary">
  <div class="event">
    <h1>
      {$frozenRat?.name} DIED
    </h1>
  </div>
  <a href="/" class="close-button"> COME DOWN </a>
</div>

<style lang="scss">
  .summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    position: relative;
    bottom: 0;
    height: 100px;
    width: var(--game-window-width);
    background: var(--background-semi-transparent);

    .event {
      background: var(--color-death);
      margin: 0;
      padding: 0;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .close-button {
      border: none;

      background: var(--black);
      background: var(--color-alert-priority);

      &:hover {
        background: var(--color-alert);
        color: var(--white);
      }
    }
  }
</style>
