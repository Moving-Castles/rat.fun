<script lang="ts">
  let { onComplete }: { onComplete: () => void } = $props()
  import { BigButton } from "$lib/components/Shared"
</script>

<div class="introduction">
  <div class="inner-container">
    <img class="image" src="/images/slides/intro.jpg" alt="RAT.FUN" />
    <div class="enter-button">
      <BigButton text="Enter" onclick={onComplete} />
    </div>
  </div>
</div>

<style lang="scss">
  .introduction {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;

      img {
        height: 60dvh;
      }

      .enter-button {
        margin-top: 20px;
        width: 400px;
        height: 80px;
      }
    }
  }
</style>
