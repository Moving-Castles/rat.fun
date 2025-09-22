<script lang="ts">
  let { value }: { value: number } = $props()

  let healthLevel = $derived(Math.floor(value / 25))
</script>

<div class="health-bar">
  <div class="health-bar-inner">
    <div
      class="health-bar-inner-fill"
      style:width={`${value}%`}
      class:health-level-1={healthLevel === 1}
      class:health-level-2={healthLevel === 2}
      class:health-level-3={healthLevel === 3}
      class:health-level-4={healthLevel === 4}
    ></div>
  </div>
</div>

<style lang="scss">
  .health-bar {
    width: 100%;
    height: 100%;

    .health-bar-inner {
      width: 100%;
      height: 100%;
      background: rgb(135, 255, 135);
    }

    .health-level-1 {
      background: rgb(255, 66, 66);
    }

    .health-level-2 {
      background: rgb(255, 189, 135);
    }

    .health-level-3 {
      background: rgb(135, 255, 135);
    }

    .health-level-4 {
      background: rgb(129, 255, 255);
    }
  }
</style>
