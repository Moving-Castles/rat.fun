<script lang="ts">
  import { getModalState } from "./state.svelte"
  let {
    content,
    noclose = false,
    onclose,
  }: {
    content: ReturnType<import("svelte").Snippet>
    noclose: boolean
    onclose?: () => void
  } = $props()

  let { modal } = getModalState()

  $effect(() => {
    if (noclose) {
      modal.setConfig({ noclose: true })
    } else {
      modal.setConfig({ noclose: false })
    }
    modal.set(content)
  })

  $effect(() => {
    if (!modal.show) onclose?.()
  })
</script>
