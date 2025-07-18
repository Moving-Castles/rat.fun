<script lang="ts">
  import { sendGiveCallerTokens, busy } from "$lib/modules/action-manager/index.svelte"
  import gsap from "gsap"
  import { onMount } from "svelte"
  import { player } from "$lib/modules/state/base/stores"

  import { BigButton } from "$lib/components/Shared"
  import VideoLoader from "$lib/components/Shared/Loaders/VideoLoader.svelte"

  const { onComplete = () => {} } = $props<{
    onComplete: (isSpawned: boolean) => void
  }>()

  let buttonText = "Get RatFunTokens"
  let message = `${$player?.name ?? "Loser"}, your money is not good here. You need RatFunTokens to play.`

  let imageElement: HTMLImageElement | null = $state(null)
  let messageElement: HTMLParagraphElement | null = $state(null)
  let buttonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  async function getTokens() {
    await sendGiveCallerTokens()
    onComplete()
  }

  onMount(() => {
    if (!buttonElement || !messageElement || !imageElement) return

    // Set initial opacity to 0
    imageElement.style.opacity = "0"
    buttonElement.style.opacity = "0"
    messageElement.style.opacity = "0"

    timeline.to(imageElement, {
      opacity: 1,
      duration: 0.4,
      delay: 0.4
    })
    timeline.to(messageElement, {
      opacity: 1,
      duration: 0.4
    })
    timeline.to(buttonElement, {
      opacity: 1,
      duration: 0.4
    })
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    {#if busy.GiveCallerTokens.current !== 0}
      <VideoLoader progress={busy.GiveCallerTokens} />
    {:else}
      <img class="image" src="/images/cashier2.png" alt="RAT.FUN" bind:this={imageElement} />
      <p bind:this={messageElement}>{message}</p>
      <div class="button" bind:this={buttonElement}>
        <BigButton text={buttonText} onclick={getTokens} />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      width: 500px;

      img {
        height: 50dvh;
        @media (max-width: 900px) {
          width: 70dvw;
          height: auto;
        }
      }
      .button {
        width: 100%;
        height: 80px;
      }
    }
  }
</style>
