<script lang="ts">
  import { Toasts as BaseToasts } from "@ratfun/shared-ui/Toasts"
  import { toastManager } from "$lib/modules/ui/toasts.svelte"

  const onRemove = (id: string) => {
    toastManager.remove(id)
  }
</script>

<BaseToasts toasts={toastManager.toasts} {onRemove} />
