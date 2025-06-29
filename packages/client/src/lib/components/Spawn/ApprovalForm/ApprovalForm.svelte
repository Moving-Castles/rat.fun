<script lang="ts">
  import { gameConfig } from "$lib/modules/state/base/stores"
  import { approveMax } from "$lib/modules/on-chain-action"
  import { busy as busyState } from "$lib/modules/action-manager/index.svelte"
  import { playerERC20Balance } from "$lib/modules/state/base/stores"

  import gsap from "gsap"
  import { onMount } from "svelte"

  import { BigButton } from "$lib/components/Shared"
  import VideoLoader from "$lib/components/Shared/Loaders/VideoLoader.svelte"

  const { onComplete = () => {} } = $props<{
    onComplete: () => void
  }>()

  let textElement: HTMLDivElement | null = $state(null)
  let imageElement: HTMLImageElement | null = $state(null)
  let buttonElement: HTMLDivElement | null = $state(null)
  let busy = $state(false)
  const timeline = gsap.timeline()

  async function sendApproval() {
    if (busy) return
    busy = true
    try {
      await approveMax($gameConfig.externalAddressesConfig.gamePoolAddress)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
      onComplete()
    }
  }

  onMount(() => {
    if (!buttonElement || !textElement || !imageElement) return

    // Set initial opacity to 0
    imageElement.style.opacity = "0"
    textElement.style.opacity = "0"
    buttonElement.style.opacity = "0"

    timeline.to(imageElement, {
      opacity: 1,
      duration: 0.4,
      delay: 0.4
    })
    timeline.to(textElement, {
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
    {#if busy}
      <VideoLoader progress={busyState.Spawn} />
    {:else}
      <img class="image" src="/images/cashier3.png" alt="RAT.FUN" bind:this={imageElement} />
      <div class="text" bind:this={textElement}>
        <p>Good. You now have {$playerERC20Balance} tokens.</p>
        <p>You just need give us permission to spend them.</p>
      </div>
      <div class="button" bind:this={buttonElement}>
        <BigButton text="APPROVE" onclick={sendApproval} />
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

      .image {
        width: 100%;
      }

      .button {
        width: 100%;
        height: 80px;
      }
    }
  }
</style>
