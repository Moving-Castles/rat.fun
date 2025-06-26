<script lang="ts">
  // ...
</script>

<div class="center-bar"></div>

<style lang="scss">
  .center-bar {
    width: 100%;
    height: 100%;
    position: relative;
    border-right: var(--dashed-border-style);
    border-left: var(--dashed-border-style);
    background: repeating-linear-gradient(
      45deg,
      #000000,
      #000000 20px,
      var(--color-grey-dark) 20px,
      var(--color-grey-dark) 40px
    );
  }
</style>
