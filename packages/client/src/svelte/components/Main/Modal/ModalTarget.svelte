<script lang="ts">
  import { getModalState } from "./state.svelte"
  let { content, onclose } = $props()
  let { modal } = getModalState()

  $effect(() => {
    modal.set(content)
  })

  $effect(() => {
    if (!modal.show) onclose()
  })
</script>
