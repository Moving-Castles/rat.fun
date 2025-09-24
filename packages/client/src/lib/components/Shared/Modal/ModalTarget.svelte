<script lang="ts">
  import { getModalState } from "./state.svelte"
  import { onMount } from "svelte"
  let {
    content,
    noclose = false,
    fullscreen = false,
    onclose,
    target = "main"
  }: {
    content: ReturnType<import("svelte").Snippet>
    noclose: boolean
    fullscreen?: boolean
    target: string
    onclose?: () => void
  } = $props()

  let { modal } = getModalState()

  // ???
  $effect(() => {
    if (!modal.show) onclose?.()
  })

  onMount(() => {
    if (fullscreen) {
      modal.setConfig({ fullscreen: true })
    }
    if (noclose) {
      modal.setConfig({ noclose: true, target })
    } else {
      modal.setConfig({ noclose: false, target })
    }
    modal.set(content)
  })
</script>
