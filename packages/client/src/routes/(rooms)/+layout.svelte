<script lang="ts">
  import "../../app.css"
  import "tippy.js/dist/tippy.css"
  import type { LayoutProps } from "./$types"
  import { onMount } from "svelte"
  import { initSound } from "$lib/modules/sound"
  import { MainLayout } from "$lib/components/Shared"

  let { children, data }: LayoutProps = $props()

  const { environment } = data

  onMount(async () => {
    // Remove preloader
    document.querySelector(".preloader")?.remove()

    // Preload sounds
    initSound()
  })
</script>

<MainLayout {environment}>
  {@render children?.()}
</MainLayout>
