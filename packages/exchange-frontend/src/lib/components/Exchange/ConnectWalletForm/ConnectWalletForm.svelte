<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { entryKitButton } from "$lib/modules/entry-kit/stores"

  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"

  let buttonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  function onEntrykitButtonClick() {
    // !!! HACK
    // Definitly not the best way to do this...

    // Find the entrykit-button-container
    const entrykitContainer = document.querySelector(".entrykit-button-container")
    if (!entrykitContainer) {
      console.error("entrykit-button-container not found")
      return
    }

    // Find the first iframe within the container
    const iframe = entrykitContainer.querySelector("iframe")
    if (!iframe) {
      console.error("iframe not found within entrykit-button-container")
      return
    }

    // Wait for iframe to load, then find and click the first button
    iframe.addEventListener(
      "load",
      () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
          if (!iframeDoc) {
            console.error("Cannot access iframe content")
            return
          }

          const firstButton = iframeDoc.querySelector("button")
          if (firstButton) {
            firstButton.click()
          } else {
            console.error("No button found in iframe")
          }
        } catch (error) {
          console.error("Error accessing iframe content:", error)
        }
      },
      { once: true }
    )

    // If iframe is already loaded, try to access it immediately
    if (iframe.contentDocument?.readyState === "complete") {
      iframe.dispatchEvent(new Event("load"))
    }
  }

  onMount(() => {
    if (!buttonElement) {
      return
    }

    // Set initial opacity to 0
    buttonElement.style.opacity = "0"

    // Animate opacity to 1
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
    <div class="button-container" bind:this={buttonElement}>
      <BigButton text="Connect wallet" onclick={onEntrykitButtonClick} />
    </div>
    <div class="entrykit-button-container">
      <div bind:this={$entryKitButton}></div>
    </div>
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
      max-width: 90dvw;

      .button-container {
        width: 100%;
        height: 200px;
        margin-bottom: 20px;
      }

      .entrykit-button-container {
        opacity: 0;
        pointer-events: none;
        height: 0;
      }
    }
  }
</style>
