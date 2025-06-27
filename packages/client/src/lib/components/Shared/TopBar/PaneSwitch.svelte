<script lang="ts">
  import { page } from "$app/state"

  let selectionIndicator = $state<HTMLElement>()

  $effect(() => {
    if (selectionIndicator) {
      selectionIndicator.style.transform = `translateX(${page.route.id?.includes("/(rooms)/rat") ? 0 : 200}px)`
    }
  })
</script>

<div class="pane-switch">
  <div class="pane-switch-item" class:selected={page.route.id?.includes("/(rooms)/rat")}>
    <a href="/rat">RAT</a>
  </div>
  <div class="pane-switch-item" class:selected={page.route.id?.includes("/(rooms)/landlord")}>
    <a href="/landlord">LANDLORD</a>
  </div>
  <div class="selection-indicator" bind:this={selectionIndicator}></div>
</div>

<style lang="scss">
  .pane-switch {
    display: flex;
    flex-direction: row;
    border-bottom: var(--default-border-style);
    height: var(--pane-switch-height);
    line-height: var(--pane-switch-height);
    width: 400px;
    background: var(--color-grey-mid);
    position: relative;

    .pane-switch-item {
      text-align: center;
      padding-inline: 20px;
      border: none;
      outline: none;
      font-family: var(--label-font-stack);
      color: var(--background);
      width: 200px;
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
        color: var(--background);
        font-family: var(--label-font-stack);
        font-size: var(--font-size-large);
        letter-spacing: -0.2em;
        text-decoration: none;
        transition: transform 0.2s ease-in-out;
      }

      &:hover {
        a {
          transform: scale(1.4);
        }
      }
    }

    .selection-indicator {
      position: absolute;
      top: 0;
      left: 0;
      width: 200px;
      height: 100%;
      background: var(--color-alert);
      z-index: 10;
      transition: transform 0.2s ease-out;
    }
  }
</style>
