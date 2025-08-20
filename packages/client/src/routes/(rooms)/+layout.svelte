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

  let sound = $state()

  const { environment } = data

  const getEnvironmentalSound = routeId => {
    let s

    if ($UIState === UI.LOADING || $UIState === UI.SPAWNING) {
      s = playSound("ratfun", "intro", true, true, 1, false)
    } else {
      console.log(page.route.id)
      console.log(page.url)
      if (routeId.includes("admin")) {
        s = playSound("ratfun", "admin", true, true, 1, false)
      } else if (routeId.includes("enter") || routeId.includes("outcomeId")) {
        s = playSound("ratfun", "outcome", true, true, 1, false)
      } else {
        s = playSound("ratfun", "main", true, true, 1, false)
      }
    }
    return s
  }

  const switchSound = newSound => {
    if (sound && newSound?._src !== sound?._src) {
      sound.stop()
      sound = newSound
      sound?.play()
    } else {
      sound = newSound
      sound?.play()
    }
  }

  $effect(() => {
    const s = getEnvironmentalSound(page.route.id)
    switchSound(s)
  })

  onMount(async () => {
    // Remove preloader
    document.querySelector(".preloader")?.remove()

    // Preload sounds
    initSound()
  })

  afterNavigate(() => {
    const s = getEnvironmentalSound(page.route.id)
    switchSound(s)
  })
</script>

<MainLayout {environment}>
  {@render children?.()}
</MainLayout>
