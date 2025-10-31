<script lang="ts">
  import { fade } from "svelte/transition"
  import { goto } from "$app/navigation"
  import { ShaderLocal } from "$lib/components/Shared"
  import { playSound } from "$lib/modules/sound"
  import { ModeSwitchButton } from "$lib/components/Shared"
  import { LogText } from "$lib/components/GameRun"
  import { Tween } from "svelte/motion"
  import { showAdminUnlockModal } from "$lib/modules/state/stores"

  let firstAppearance = $state(false)

  // Create tweened positions for the text element
  let textX = new Tween(0, { duration: 2000 })
  let textY = new Tween(0, { duration: 2000 })
  let buttonX = new Tween(0, { duration: 2000 })
  let buttonY = new Tween(0, { duration: 2000 })

  // Watch for unlock trigger
  $effect(() => {
    if ($showAdminUnlockModal && !firstAppearance) {
      firstAppearance = true
      showAdminUnlockModal.set(false) // Reset for future use
    }
  })

  // Update positions with random values periodically
  $effect(() => {
    if (firstAppearance) {
      const updatePosition = () => {
        const randomX = (Math.random() - 0.5) * 20 // Random between -10 and 10
        const randomY = (Math.random() - 0.5) * 20 // Random between -10 and 10
        const randomX2 = (Math.random() - 0.5) * 20 // Random between -10 and 10
        const randomY2 = (Math.random() - 0.5) * 20 // Random between -10 and 10

        textX.set(randomX)
        textY.set(randomY)
        buttonX.set(randomX2)
        buttonY.set(randomY2)
      }

      updatePosition()
      const interval = setInterval(updatePosition, 2000)

      return () => clearInterval(interval)
    }
  })
</script>

{#if firstAppearance}
  <div transition:fade|global class="bg">
    <ShaderLocal shaderKey="magic" />
  </div>
  <div
    transition:fade|global
    onintroend={() => {
      playSound("ratfunTransitions", "adminEnter")
    }}
    class="modal"
  >
    <div
      onclick={() => showAdminUnlockModal.set(false)}
      style="transform: translate({buttonX.current}px, {buttonY.current}px);"
      class="mode-switch"
    >
      <ModeSwitchButton isAdminView={false} onclick={() => goto("/cashboard")} />
    </div>
    <div class="text" style="transform: translate({textX.current}px, {textY.current}px);">
      Something feels... Different. <br />Like I can see through the fabric of it all
    </div>
  </div>
{/if}

<style lang="scss">
  .modal {
    position: fixed;
    z-index: 10;
    width: 100dvw;
    height: 100dvh;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .bg {
    mix-blend-mode: multiply;
    position: absolute;
    inset: 0;
  }

  .mode-switch {
    position: absolute;
    width: 160px;
    height: 54px;
    top: 18px;
    right: 16px;
    box-shadow: 0 0 20px black;
  }

  .text {
    position: absolute;
    bottom: 2rem;
    left: 2rem;
    background: black;
  }
</style>
