<!-- page@.svelte resets the layout all the way to the root -->

<script lang="ts">
  import { RoomResult } from "$lib/components/Room"
  import { page } from "$app/state"
</script>

<!-- Enter is first hit, that route creates the outcome while serving a splash screen -->

<RoomResult roomId={page.params.roomId} />
