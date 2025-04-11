<script lang="ts">
  // ...
</script>

<div class="floor-bar"></div>

<style lang="scss">
  .floor-bar {
    width: 160px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-right: 1px dashed white;
    border-left: 1px dashed white;
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
