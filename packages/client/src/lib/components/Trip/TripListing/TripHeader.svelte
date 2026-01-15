<script lang="ts">
  let {
    eligibleCount,
    totalCount,
    hasBackButton = false
  }: {
    eligibleCount?: number
    totalCount?: number
    hasBackButton?: boolean
  } = $props()
</script>

<div class="trip-header" class:with-back-button={hasBackButton}>
  <div class="header-text">
    <!-- <span>{title}</span> -->
    {#if eligibleCount !== undefined && totalCount !== undefined}
      <span class="trips-count">
        {totalCount} trips
      </span>
    {/if}
  </div>
</div>

<style lang="scss">
  .trip-header {
    line-height: 40px;
    height: 40px;
    border-bottom: var(--default-border-style);
    padding-inline: 20px;
    display: flex;
    overflow: hidden;
    position: sticky;
    top: 0;
    z-index: var(--z-high);
    background-repeat: repeat;
    text-align: center;
    justify-content: center;
    background: var(--background-semi-transparent);
    user-select: none;
    text-align: right;

    @media screen and (max-width: 800px) {
      height: var(--top-bar-height-phone);
      line-height: var(--top-bar-height-phone);
    }

    &.with-back-button {
      top: 60px;
    }
  }

  .header-text {
    font-size: var(--font-size-small);
    font-family: var(--typewriter-font-stack);
    color: var(--foreground);
  }

  .trips-count {
    color: var(--color-grey-light);
  }
</style>
