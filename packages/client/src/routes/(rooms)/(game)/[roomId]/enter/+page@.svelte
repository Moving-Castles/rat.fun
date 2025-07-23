<!-- page@.svelte resets the layout all the way to the root -->

<script lang="ts">
  import { RoomResult } from "$lib/components/Room"
  import { page } from "$app/state"
  import { sessionId } from "$lib/modules/session/state.svelte"
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"

  onMount(() => {
    if ($sessionId !== new URL(window.location.href).searchParams.get("sessionId")) {
      console.warn("session ID mismatch")
      goto("/")
    } else {
      sessionId.set("")
    }
  })
</script>

<RoomResult roomId={page.params.roomId} />
