<script lang="ts">
  import { Tooltip } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
</script>

<div class="operator-avatar">
  <Tooltip content={UI_STRINGS.youIndication}>
    <div class="avatar">
      <enhanced:img
        src="../../../../../../static/images/pfp.png"
        alt={UI_STRINGS.you}
        draggable={false}
      />
    </div>
  </Tooltip>
</div>

<style lang="scss">
  .operator-avatar {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 10px;
    border-right: var(--default-border-style);

    @media (max-width: 800px) {
      display: none;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border: 1px solid var(--color-grey-light);
      border-radius: 50%;
      overflow: hidden;

      :global(img) {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }
</style>
