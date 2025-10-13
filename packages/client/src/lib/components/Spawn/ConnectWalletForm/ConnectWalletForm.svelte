<script lang="ts">
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { entryKitButton } from "$lib/modules/entry-kit/stores"

  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"

  const { walletType, onComplete = () => {} } = $props<{
    walletType: WALLET_TYPE
    onComplete: () => void
  }>()

  let message = $derived(
    walletType === WALLET_TYPE.ENTRYKIT
      ? "Connect your wallet to proceed."
      : "Connect your wallet to proceed."
  )

  let messageElement: HTMLParagraphElement | null = $state(null)
  let buttonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  onMount(() => {
    if (!messageElement) {
      return
    }

    // Set initial opacity to 0
    messageElement.style.opacity = "0"
    if (buttonElement) buttonElement.style.opacity = "0"

    // Animate opacity to 1
    timeline.to(messageElement, {
      opacity: 1,
      duration: 0.4,
      delay: 0.4
    })
    if (buttonElement) {
      timeline.to(buttonElement, {
        opacity: 1,
        duration: 0.4
      })
    }
  })
</script>

<div class="outer-container">
  <div class="inner-container">
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

      p {
        font-size: var(--font-size-large);
        background: var(--background);
        color: var(--foreground);
        padding: 10px;
      }

      .button-container {
        width: 100%;
        height: 200px;
      }
    }
  }
</style>
