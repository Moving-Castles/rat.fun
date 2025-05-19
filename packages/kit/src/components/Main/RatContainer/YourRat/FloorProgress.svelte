<script lang="ts">
  import { ratLevel, ratTotalValue } from "@modules/state/base/stores"

  let progress = $derived(
    (Number($ratTotalValue) - Number($ratLevel.levelMinBalance)) /
      Number($ratLevel.levelMaxBalance)
  )
</script>

<div class="floor-progress">
  <div class="progress" style:width="{progress * 100}%"></div>
  <div class="info">
    <div>
      Floor progress: {Math.round(
        ((Number($ratTotalValue) - Number($ratLevel.levelMinBalance)) /
          Number($ratLevel.levelMaxBalance)) *
          100
      )}%
    </div>
  </div>
</div>

<style lang="scss">
  .floor-progress {
    height: var(--floor-progress-height);
    border-bottom: var(--default-border-style);
    background: #232323;
    overflow: hidden;
    position: relative;
    background-repeat: repeat-x;
    background-size: 40px 100%;
    opacity: 0.9;

    .progress {
      background: var(--color-alert);
      height: 100%;
      display: block;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
      overflow: hidden;
    }

    .info {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding-left: 10px;
      z-index: 2;
      display: flex;
      align-items: center;
    }
  }
</style>
