<script lang="ts">
  // ...
</script>

<div class="center-bar"></div>

<style lang="scss">
  .center-bar {
    width: var(--game-center-bar-width);
    height: 100%;
    position: relative;
    border-right: var(--dashed-border-style);
    border-left: var(--dashed-border-style);
    opacity: 0.8;
    background: repeating-linear-gradient(
      45deg,
      #000000,
      #000000 20px,
      var(--color-grey-dark) 20px,
      var(--color-grey-dark) 40px
    );

    @media (max-width: 800px) {
      width: 100%;
      height: var(--game-center-bar-phone-height);
    }
  }
</style>
