<script lang="ts">
  import { type Tween } from "svelte/motion"
  let { progress, text }: { progress: Tween<number>; text?: string } = $props()
</script>

<div class="video-loader">
  {#if text}
    <div class="text">{text}</div>
  {/if}
  <div class="loading-bar-container">
    <div class="loading-bar" style="transform: scaleX({progress.current})"></div>
  </div>
  <video class="video" src="/videos/loading.mov" autoplay loop muted playsinline></video>
</div>

<style lang="scss">
  .video-loader {
    text-align: center;
    color: var(--white);
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;

    .video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .text {
      font-size: 200px;
      color: red;
      mix-blend-mode: multiply;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: var(--z-high);
    }

    .loading-bar-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      height: 20px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      overflow: hidden;
      z-index: var(--z-high);
    }

    .loading-bar {
      width: 100%;
      height: 100%;
      background: white;
      transform-origin: left;
      transition: transform 16ms linear;
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
</style>
