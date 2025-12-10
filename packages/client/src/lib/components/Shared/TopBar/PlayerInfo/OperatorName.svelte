<script lang="ts">
  import { player } from "$lib/modules/state/stores"
  import { Tooltip } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
</script>

<div class="operator-name">
  <Tooltip content={UI_STRINGS.youIndication}>
    <div class="label">
      {UI_STRINGS.operator}
    </div>
    <div class="content">
      {$player?.name ?? ""}
    </div>
  </Tooltip>
</div>

<style lang="scss">
  .operator-name {
    height: 100%;
    padding: 0;
    width: 100%;
    color: var(--white);
    border-right: var(--default-border-style);
    border-left: var(--default-border-style);
    display: flex;
    flex-direction: column;
    min-width: 100px;

    :global(> *) {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .label {
      font-size: var(--font-size-small);
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 2px;
      padding-bottom: 2px;
      width: 100%;
      color: var(--color-grey-light);
      border-bottom: 1px solid var(--color-border);
    }

    .content {
      flex: 1;
      font-size: var(--font-size-normal);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding-inline: 10px;
    }
  }
</style>
