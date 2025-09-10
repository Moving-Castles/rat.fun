<script lang="ts">
  import "../../app.css"
  import "tippy.js/dist/tippy.css"
  import type { LayoutProps } from "./$types"
  import { onMount } from "svelte"
  import { page } from "$app/state"
  import { initSound } from "$lib/modules/sound"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { MainLayout } from "$lib/components/Shared"
  import { afterNavigate } from "$app/navigation"
  import { playSound } from "$lib/modules/sound"

  let { children, data }: LayoutProps = $props()

  let sound = $state<Howl | undefined>()

  const { environment } = data

  const getEnvironmentalSound = (routeId: string) => {
    if (!routeId) {
      return undefined
    }

    let localSound

    if ($UIState === UI.LOADING || $UIState === UI.SPAWNING) {
      localSound = playSound("ratfun", "intro", true, true, 1, false)
    } else {
      if (routeId.includes("admin")) {
        localSound = playSound("ratfun", "admin", true, true, 1, false)
      } else if (routeId.includes("result") || routeId.includes("outcomeId")) {
        console.log("holding; ")
        // localSound = playSound("ratfun", "outcome", true, true, 1, false)
      } else {
        localSound = playSound("ratfun", "mainAll", true, true, 1, false)
      }
    }
    return localSound
  }

  const switchSound = (newSound: Howl | undefined) => {
    if (sound && newSound?.src !== sound?._src) {
      sound.stop()
      sound = newSound
      sound?.play()
    } else {
      sound = newSound
      sound?.play()
    }
  }

  $effect(() => {
    const s = getEnvironmentalSound(page.route.id ?? "")
    switchSound(s)
  })

  onMount(async () => {
    // Remove preloader
    document.querySelector(".preloader")?.remove()

    // Preload sounds
    initSound()
  })

  afterNavigate(() => {
    const s = getEnvironmentalSound(page.route.id ?? "")
    switchSound(s)
  })
</script>

<MainLayout {environment}>
  {@render children?.()}
</MainLayout>
