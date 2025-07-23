<!-- page@.svelte resets the layout all the way to the root -->

<script lang="ts">
  import { RoomResult } from "$lib/components/Room"
  import { sessionId } from "$lib/modules/session/state.svelte"
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import { page } from "$app/state"

  let valid = $derived($sessionId === page.url?.searchParams.get("sessionId"))

  onMount(() => {
    if (!valid) {
      console.warn("session ID mismatch")
      goto("/")
    } else {
      sessionId.set("")
    }
  })
</script>

<RoomResult roomId={page.params.roomId} {valid} />
