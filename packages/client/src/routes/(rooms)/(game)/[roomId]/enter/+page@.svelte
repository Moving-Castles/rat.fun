<!-- page@.svelte resets the layout all the way to the root -->

<script lang="ts">
  import { RoomResult } from "$lib/components/Room"
  import { page } from "$app/state"
</script>

<RoomResult roomId={page.params.roomId} />
