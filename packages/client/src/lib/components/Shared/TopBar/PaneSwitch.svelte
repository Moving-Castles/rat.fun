<script lang="ts">
  import { page } from "$app/state"
  import { playSound } from "$lib/modules/sound"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  let { isAdminView }: { isAdminView: boolean } = $props()

  const onmousedown = () => {
    playSound("ratfunUI", "smallButtonDown")
  }

  const enterAdmin = () => {
    playSound("ratfunTransitions", "adminEnter")
    shaderManager.setShader("blank")
  }

  const exitAdmin = () => {
    playSound("ratfunTransitions", "adminExit")
    shaderManager.setShader("clouds", "inverted")
  }
</script>

<div class="pane-switch">
  {#if isAdminView}
    <button onclick={exitAdmin} class="pane-switch-item">
      <a href="/{page.route.id?.includes('tripId') ? page.params.tripId : ''}">X</a>
    </button>
  {:else}
    <button onclick={enterAdmin} {onmousedown} class="pane-switch-item">
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
