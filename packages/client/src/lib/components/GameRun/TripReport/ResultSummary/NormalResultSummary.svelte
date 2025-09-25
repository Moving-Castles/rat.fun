<script lang="ts">
  import { frozenRat } from "$lib/components/GameRun/state.svelte"
  import { goto } from "$app/navigation"
  import { BigButton } from "$lib/components/Shared"
</script>

<div class="summary">
  <div class="event">
    <h1>
      {$frozenRat?.name} SURVIVED
    </h1>
  </div>
  <div class="button-container">
    <BigButton
      text="COME DOWN"
      onclick={() => {
        goto("/")
      }}
    />
  </div>
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

    .button-container {
      width: 100%;
      height: 80px;
    }
  }
</style>
