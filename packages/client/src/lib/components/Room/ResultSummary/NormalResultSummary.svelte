<script lang="ts">
  import { fade } from "svelte/transition"
  import { frozenRat } from "$lib/components/Room/Trip/state.svelte"
  import { gsap } from "gsap"
  import { goto } from "$app/navigation"

  // Timeline
  const timeline = gsap.timeline()
</script>

<div transition:fade|global class="summary">
  <div class="event">
    <h1>
      {$frozenRat?.name} SURVIVED
    </h1>
  </div>
  <button
    class="close-button"
    onclick={() => {
      goto("/")
    }}
  >
    COME DOWN
  </button>
</div>

<style lang="scss">
  .summary {
    display: flex;
    flex-direction: column;
    position: relative;
    bottom: 0;
    height: 200px;
    width: var(--game-window-width);
    width: 50vw;

    .event {
      background: var(--color-secondary);
      margin: 0;
      padding: 0;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 80px;
    }

    .close-button {
      border: none;
      height: 80px;

      background: var(--black);
      background: var(--color-alert-priority);

      &:hover {
        background: var(--color-alert);
        color: var(--white);
      }
    }
  }
</style>
