<script lang="ts">
  let { isAdminView }: { isAdminView: boolean } = $props()
</script>

<div class="pane-switch">
  {#if isAdminView}
    <div class="pane-switch-item">
      <a href="/">X</a>
    </div>
  {:else}
    <div class="pane-switch-item">
      <a href="/admin">⚙</a>
    </div>
  {/if}
</div>

<style lang="scss">
  .pane-switch {
    display: flex;
    flex-direction: row;
    border-bottom: var(--default-border-style);
    height: var(--pane-switch-height);
    line-height: var(--pane-switch-height);
    width: 100px;
    background: var(--color-grey-mid);
    position: relative;

    .pane-switch-item {
      text-align: center;
      padding-inline: 20px;
      border: none;
      outline: none;
      font-family: var(--label-font-stack);
      color: var(--background);
      width: 100px;
      z-index: 100;

      &:first-child {
        border-right: var(--default-border-style);
      }

      a {
        width: 100%;
        height: 100%;
        border: none;
        outline: none;
        display: block;
        background: transparent;
        font-family: var(--label-font-stack);
        font-size: 40px;
        letter-spacing: -0.2em;
        text-decoration: none;
        transition:
          transform 0.2s ease-in-out,
          color 0.2s;
        color: var(--background);
      }

      &:hover {
        a {
          transform: scale(1.4);
        }
      }
    }
  }
</style>
