<script lang="ts">
  // ...
</script>

<div class="splash-screen">
  <div class="inner">VISUALIZER</div>
</div>

<style lang="scss">
  .splash-screen {
    padding: 0;
    position: absolute;
    inset: 0;
    text-align: center;
    display: flex;
    height: var(--game-window-height);
    justify-content: center;
    align-items: center;
    color: var(--foreground);
    font-size: 64px;

    .inner {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      width: 500px;
      max-width: calc(var(--game-window-width) * 0.9);

      .image-container {
        width: 100%;
        border: var(--default-border-style);
        line-height: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          aspect-ratio: 1/1;
        }

        .image-placeholder {
          width: 100%;
          aspect-ratio: 1/1;
        }
      }

      .prompt {
        background: var(--color-alert);
        color: var(--background);
        width: auto;
        display: inline-block;
        padding: 5px;
        max-width: 50ch;
      }

      .room-index {
        background: var(--color-alert-priority);
        color: var(--background);
        width: auto;
        padding: 5px;
      }
    }
  }
</style>
