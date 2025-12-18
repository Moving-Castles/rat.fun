<script lang="ts">
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  let {
    title,
    eligibleCount,
    totalCount,
    hasBackButton = false
  }: {
    title: string
    eligibleCount?: number
    totalCount?: number
    hasBackButton?: boolean
  } = $props()
</script>

<div class="trip-header" class:with-back-button={hasBackButton}>
  <div class="header-text">
    <span>{title}</span>
    {#if eligibleCount !== undefined && totalCount !== undefined}
      <span class="trips-count">
        {UI_STRINGS.trips}: {eligibleCount} / {totalCount - eligibleCount} locked
      </span>
    {/if}
  </div>
</div>

<style lang="scss">
  .trip-header {
    line-height: 60px;
    height: 60px;
    border-bottom: 1px solid var(--color-grey-mid);
    padding-inline: 20px;
    display: flex;
    overflow: hidden;
    position: sticky;
    top: 0;
    z-index: var(--z-high);
    background-repeat: repeat;
    text-align: center;
    background: var(--color-grey-dark);

    @media screen and (max-width: 800px) {
      height: var(--top-bar-height-phone);
      line-height: var(--top-bar-height-phone);
    }

    &.with-back-button {
      top: 60px;
    }
  }

  .header-text {
    font-size: var(--font-size-normal);
    font-family: var(--typewriter-font-stack);
    color: var(--foreground);
  }

  .trips-count {
    margin-left: 10px;
    color: var(--color-grey-light);
  }
</style>
