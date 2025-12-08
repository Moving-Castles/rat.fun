<script lang="ts">
  import { nonDepletedTrips } from "$lib/modules/state/stores"

  let tripCount = $derived(Object.keys($nonDepletedTrips).length)
</script>

<div class="no-rat-listing-container">
  <div class="message">
    <div class="count">{tripCount} Trips available</div>
    <div class="instruction">Buy a rat to access</div>
  </div>
</div>

<style lang="scss">
  .no-rat-listing-container {
    width: 100%;
    height: calc(100% - 60px);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .message {
    background: var(--background-semi-transparent);
    text-align: center;
    padding: 20px;
  }

  .count {
    font-size: var(--font-size-extra-large);
    font-family: var(--special-font-stack);
    margin-bottom: 10px;
  }

  .instruction {
    color: var(--color-grey-light);
  }
</style>
