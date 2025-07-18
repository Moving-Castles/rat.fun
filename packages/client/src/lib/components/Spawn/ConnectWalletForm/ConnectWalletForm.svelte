<script lang="ts">
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { onMount } from "svelte"
  import gsap from "gsap"

  import EntryKit from "$lib/components/Spawn/EntryKit/EntryKit.svelte"
  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"

  const { walletType, onComplete = () => {} } = $props<{
    walletType: WALLET_TYPE
    onComplete: () => void
  }>()

  let message = $derived(
    walletType === WALLET_TYPE.ENTRYKIT
      ? "Stop. You need an offical BASE(TM) WALLET TO ENTER."
      : "Stop. Connect your burner ID (wallet) to enter"
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
    <img src="/images/bouncer2.png" alt="BASE(TM) ID" bind:this={imageElement} />
    <p bind:this={messageElement}>{message}</p>
    {#if walletType === WALLET_TYPE.ENTRYKIT}
      <EntryKit />
    {:else}
      <div bind:this={buttonElement}>
        <BigButton text="Connect Burner" onclick={onComplete} />
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
    }
  }
</style>
