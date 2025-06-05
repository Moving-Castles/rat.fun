<script lang="ts">
  import { ratLevel } from "@modules/state/base/stores"
</script>

<div class="level-description">
  <div class="level-name">
    Floor {Number($ratLevel.index) * -1}: {$ratLevel.name}
  </div>
  <!-- {#if $ratLevel.prompt}
    <div class="level-prompt">
      {$ratLevel.prompt}
    </div>
  {/if} -->
</div>

<style lang="scss">
  .level-description {
    width: 80%;
    display: flex;
    flex-flow: column nowrap;
    // gap: 12px;
    background: var(--black);
    padding: 10px 20px;
    margin: 40px auto 0;
    opacity: 0.9;
    color: var(--color-grey-light);
    // border: 2px solid red;

    .level-name {
      width: 100%;
      // background: red;
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
