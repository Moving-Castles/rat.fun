<script lang="ts">
  const { text }: { text?: string } = $props()
</script>

<div class="video-loader">
  {#if text}
    <div class="text">{text}</div>
  {/if}
  <video src="/videos/loading.mov" autoplay loop muted playsinline></video>
</div>

<style lang="scss">
  .video-loader {
    text-align: center;
    color: var(--white);
    width: 100%;
    height: 100%;
    overflow: hidden;

    .text {
      font-size: 200px;
      color: red;
      mix-blend-mode: multiply;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
</style>
