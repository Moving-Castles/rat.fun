<script lang="ts">
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { onMount } from "svelte"
  import gsap from "gsap"

  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"
  import { entryKitButton } from "$lib/modules/entry-kit/stores"

  const { walletType, onComplete = () => {} } = $props<{
    walletType: WALLET_TYPE
    onComplete: () => void
  }>()

  let message = $derived(
    walletType === WALLET_TYPE.ENTRYKIT
      ? "Connect your wallet to proceed."
      : "Connect your wallet to proceed."
  )

  let imageElement: HTMLImageElement | null = $state(null)
  let messageElement: HTMLParagraphElement | null = $state(null)
  let buttonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  onMount(() => {
    if (!imageElement || !messageElement || !buttonElement) return

    // Set initial opacity to 0
    imageElement.style.opacity = "0"
    messageElement.style.opacity = "0"
    buttonElement.style.opacity = "0"

    // Animate opacity to 1
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
    <!-- <img src="/images/mascot1.png" alt="Mascot" bind:this={imageElement} /> -->
    <p bind:this={messageElement}>{message}</p>
    {#if walletType === WALLET_TYPE.ENTRYKIT}
      <div bind:this={$entryKitButton}></div>
    {:else}
      <div class="button-container" bind:this={buttonElement}>
        <BigButton id="connect" text="Connect Burner" onclick={onComplete} />
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
    color: var(--background);

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

      .button-container {
        width: 100%;
        height: 80px;
      }
    }
  }
</style>
