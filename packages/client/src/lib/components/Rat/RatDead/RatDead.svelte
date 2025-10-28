<script lang="ts">
  import { rat } from "$lib/modules/state/stores"
  import { BigButton, RatAvatar } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"

  const onClick = () => {
    // RAT_BOX_STATE.DEAD_RAT -> RAT_BOX_STATE.NO_RAT
    transitionTo(RAT_BOX_STATE.NO_RAT)
  }
</script>

<div class="rat-dead">
  <div class="rat-dead-image">
    <RatAvatar inert />
  </div>
  <div class="rat-dead-text">
    <h1>{$rat?.name} is dead</h1>
  </div>
  <div class="button-container">
    <BigButton text="OK" onclick={onClick} />
  </div>
</div>

<style lang="scss">
  .rat-dead {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
    color: var(--background);

    .rat-dead-image {
      width: 260px;
      height: 260px;
      transform: rotate(90deg);
      filter: grayscale(1);

      @media (max-width: 700px) {
        width: 160px;
        height: 160px;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: grayscale(1);
      }
    }

    .rat-dead-text {
      font-size: var(--font-size-normal);
      font-family: var(--special-font-stack);
      color: var(--foreground);
    }

    .button-container {
      overflow: hidden;
      width: 80%;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 120px;
    }
  }
</style>
