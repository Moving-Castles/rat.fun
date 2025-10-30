<script lang="ts">
  import { tippy } from "svelte-tippy"
  import { formatDate } from "$lib/modules/utils"
  import type { OffChainMessage } from "@websocket-server/modules/types"

  let { event }: { event: OffChainMessage } = $props()
</script>

<span
  use:tippy={{
    content: formatDate(new Date(event.timestamp))
  }}
  class="timestamp"
>
  {event.playerName}
</span>
