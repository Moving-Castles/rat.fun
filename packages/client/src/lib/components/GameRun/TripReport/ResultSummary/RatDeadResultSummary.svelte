<script lang="ts">
  import { frozenRat } from "$lib/components/GameRun/state.svelte"
  import { goto } from "$app/navigation"
  import { ratImageUrl } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
</script>

<div class="summary-container">
  <div class="summary">
    <div class="event">
      <div class="image">
        <img src={$ratImageUrl} alt={$frozenRat?.name} />
      </div>
      <div class="event-text">
        {$frozenRat?.name} DIED
      </div>
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
</div>

<style lang="scss">
  .summary-container {
    display: flex;
    flex-direction: column;
    position: relative;
    bottom: 0;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-image: url("/images/texture-2.png");

    .event {
      background: var(--color-death);
      margin: 0;
      padding: 0;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 80px;
    }

    .image {
      width: 200px;
      height: 200px;
      img {
        width: 100%;
        height: 100%;
      }
    }

    .button-container {
      width: 100%;
      height: 80px;
    }
  }
</style>
