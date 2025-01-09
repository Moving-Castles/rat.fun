<script>
  import Spinner from "@svelte/components/Spinner/Spinner.svelte"
</script>

<div class="wait">
  <Spinner />
</div>

<style lang="scss">
  .wait {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
  }
</style>
