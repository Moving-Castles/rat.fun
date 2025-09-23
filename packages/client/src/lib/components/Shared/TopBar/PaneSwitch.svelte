<script lang="ts">
  import { page } from "$app/state"
  import { playUISound } from "$lib/modules/sound/state.svelte"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let { isAdminView }: { isAdminView: boolean } = $props()
</script>

<div class="pane-switch">
  {#if isAdminView}
    <button
      onclick={() => {
        playUISound("ratfun", "adminExit")
        shaderManager.setShader("clouds", "inverted")
      }}
      class="pane-switch-item"
    >
      <a href="/{page.route.id?.includes('roomId') ? page.params.roomId : ''}">X</a>
    </button>
  {:else}
    <button
      onclick={() => {
        shaderManager.setShader("blank")
        playUISound("ratfun", "adminAccess")
      }}
      class="pane-switch-item"
    >
      <a href="/admin">⚙</a>
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
    background: var(--color-grey-dark);
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
      background: var(--color-grey-light);

      a {
        border: none;
        outline: none;
        display: block;
        background: transparent;
        font-family: var(--label-font-stack);
        font-size: 40px;
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
