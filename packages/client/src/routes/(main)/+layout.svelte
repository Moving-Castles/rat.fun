<script lang="ts">
  import type { LayoutProps } from "./$types"
  import MainLayout from "$lib/components/MainLayout/MainLayout.svelte"

  let { children }: LayoutProps = $props()
</script>

<MainLayout>
  {@render children?.()}
</MainLayout>
