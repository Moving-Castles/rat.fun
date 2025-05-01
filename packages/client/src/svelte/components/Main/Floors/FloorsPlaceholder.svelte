<script lang="ts">
  // ...
</script>

<div class="floor-bar"></div>

<style lang="scss">
  .floor-bar {
    width: 100%;
    height: 100%;
    border-right: var(--dashed-border-style);
    border-left: var(--dashed-border-style);
    position: relative;
    background: repeating-linear-gradient(
      45deg,
      #000000,
      #000000 20px,
      var(--color-grey-dark) 20px,
      var(--color-grey-dark) 40px
    );
  }
</style>
