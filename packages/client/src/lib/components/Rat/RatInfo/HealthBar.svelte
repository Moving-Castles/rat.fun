<script lang="ts">
  let { value }: { value: number } = $props()

  // Health 0-25 => 1
  // Health 26-50 => 2
  // Health 51-75 => 3
  // Health 76-> => 4

  let healthLevel = $derived(Math.floor(value / 25))

  $inspect(healthLevel)
</script>

<div class="health-bar">
  <div class="health-bar-inner">
    <div
      class="health-bar-inner-fill"
      style:width={`${value}%`}
      class:health-level-1={healthLevel == 1}
      class:health-level-2={healthLevel == 2}
      class:health-level-3={healthLevel == 3}
      class:health-level-4={healthLevel == 4}
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
    }

    .health-bar-inner-fill {
      height: 100%;
      transition: width 0.2s ease-in-out;
    }

    .health-level-1 {
      background: rgb(255, 66, 66);
    }

    .health-level-2 {
      background: rgb(255, 126, 21);
    }

    .health-level-3 {
      background: rgb(129, 255, 255);
    }

    .health-level-4 {
      background: rgb(135, 255, 135);
    }
  }
</style>
