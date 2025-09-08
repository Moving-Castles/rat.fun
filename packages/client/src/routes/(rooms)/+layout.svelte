<script lang="ts">
  import "../../app.css"
  import "tippy.js/dist/tippy.css"
  import type { LayoutProps } from "./$types"
  import { onMount } from "svelte"
  import { page } from "$app/state"
  import { initSound, startAudioContext } from "$lib/modules/sound"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { MainLayout } from "$lib/components/Shared"
  import { afterNavigate } from "$app/navigation"
  import { playSound } from "$lib/modules/sound"

  let { children, data }: LayoutProps = $props()

  let sound = $state()

  const { environment } = data

  const getEnvironmentalSound = async routeId => {
    let s

    if ($UIState === UI.LOADING || $UIState === UI.SPAWNING) {
      s = await playSound("ratfun", "intro", true, true, 1, false)
    } else {
      console.log(page.route.id)
      console.log(page.url)
      if (routeId.includes("admin")) {
        s = await playSound("ratfun", "admin", true, true, 1, false)
      } else if (routeId.includes("enter") || routeId.includes("outcomeId")) {
        s = await playSound("ratfun", "outcome", true, true, 1, false)
      } else {
        s = await playSound("ratfun", "main", true, true, 1, false)
      }
    }
    return s
  }

  const switchSound = newSound => {
    if (sound && newSound?.src !== sound?.src) {
      sound.stop()
      sound = newSound
      sound?.start()
    } else {
      sound = newSound
      sound?.start()
    }
  }

  const triggerSwitch = async (p: import("@sveltejs/kit").Page) => {
    const s = await getEnvironmentalSound(p.route.id)
    if (s) {
      switchSound(s)
    }
  }

  $effect(() => {
    triggerSwitch(page)
  })

  onMount(async () => {
    // Remove preloader
    document.querySelector(".preloader")?.remove()

    // Preload sounds
    await initSound()
    
    // Enable audio on first user interaction
    const enableAudio = async () => {
      await startAudioContext()
      document.removeEventListener("click", enableAudio)
      document.removeEventListener("touchstart", enableAudio)
      document.removeEventListener("keydown", enableAudio)
    }
    
    document.addEventListener("click", enableAudio)
    document.addEventListener("touchstart", enableAudio)
    document.addEventListener("keydown", enableAudio)
  })

  afterNavigate(() => {
    triggerSwitch(page)
  })
</script>

<MainLayout {environment}>
  {@render children?.()}
</MainLayout>
