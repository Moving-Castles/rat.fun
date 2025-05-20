<script lang="ts">
  import { getModalState } from "./state.svelte"
  let {
    content,
    noclose = false,
    onclose,
    target = "main",
  }: {
    content: ReturnType<import("svelte").Snippet>
    noclose: boolean
    target: string
    onclose?: () => void
  } = $props()

  let { modal } = getModalState()

  console.log("mdoal target", target)

  $effect(() => {
    if (noclose) {
      modal.setConfig({ noclose: true, target })
    } else {
      modal.setConfig({ noclose: false, target })
    }
    modal.set(content)
  })

  $effect(() => {
    if (!modal.show) onclose?.()
  })
</script>
