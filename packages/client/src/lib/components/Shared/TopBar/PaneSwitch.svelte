<script lang="ts">
  import { page } from "$app/state"
  import { playUISound } from "$lib/modules/sound/state.svelte"
  let { isAdminView }: { isAdminView: boolean } = $props()
</script>

<div class="pane-switch">
  {#if isAdminView}
    <button
      onclick={() => {
        playUISound("ratfun", "adminExit")
      }}
      class="pane-switch-item"
    >
      <a href="/{page.route.id?.includes('roomId') ? page.params.roomId : ''}">X</a>
    </button>
  {:else}
    <button
      onclick={() => {
        playUISound("ratfun", "adminAccess")
      }}
      class="pane-switch-item"
    >
      <a href="/admin{page.route.id?.includes('roomId') ? `/${page.params.roomId}` : ''}">⚙</a>
    </button>
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
