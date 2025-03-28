<script lang="ts">
  import { ratLevel, ratTotalValue, rat } from "@modules/state/base/stores"

  $effect(() => {
    console.log($rat.balance)
    console.log($ratLevel.levelMinBalance)
    console.log($ratLevel.levelMaxBalance)
  })

  let progress = $derived(
    (Number($ratTotalValue) - Number($ratLevel.levelMinBalance)) /
      Number($ratLevel.levelMaxBalance)
  )
</script>

<div class="floor-progress">
  <div class="progress" style:width="{progress * 100}%"></div>
</div>

<style lang="scss">
  .floor-progress {
    height: var(--floor-progress-height);
    border-bottom: 1px solid white;
    background: #232323;
    overflow: hidden;
    position: relative;
    background-image: url("/images/arrow-down.png");
    background-repeat: repeat-x;
    background-size: 40px 100%;
    opacity: 0.9;

    .progress {
      background: var(--color-value);
      height: 100%;
      display: block;
      position: absolute;
      left: 0;
      z-index: 1;
      overflow: hidden;
      mix-blend-mode: multiply;
    }
  }
</style>
