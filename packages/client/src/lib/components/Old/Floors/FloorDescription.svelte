<script lang="ts">
  import { ratLevel } from "$lib/modules/state/base/stores"
</script>

<div class="level-description">
  <div class="level-name">
    Floor {Number($ratLevel.index) * -1}: {$ratLevel.name}
  </div>
</div>

<style lang="scss">
  .level-description {
    width: 80%;
    display: flex;
    flex-flow: column nowrap;
    background: var(--black);
    padding: 10px 20px;
    margin: 40px auto 0;
    opacity: 0.9;
    color: var(--color-grey-light);

    .level-name {
      width: 100%;
      font-size: var(--font-size-large);
      letter-spacing: normal;
      text-align: left;
    }

    .level-prompt {
      font-family: var(--special-font-stack);
      font-size: var(--font-size-normal);
      width: 100%;
      text-align: left;
      letter-spacing: normal;
      // color: var(--white);
    }
  }
</style>
