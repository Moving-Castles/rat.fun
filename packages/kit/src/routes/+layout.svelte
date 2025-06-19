<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"

  import type { LayoutProps } from './$types';

  import { Modal } from "$lib/components/Main/Modal/state.svelte"
  import Loading from "$lib/components/Loading/Loading.svelte"
  import Main from "$lib/components/Main/Main.svelte"
  import Spawn from "$lib/components/Spawn/Spawn.svelte"

  let { children, data }: LayoutProps = $props()

  $inspect(data.environment)
</script>

{@render children?.()}
