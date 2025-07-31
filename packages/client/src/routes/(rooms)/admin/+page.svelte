<script lang="ts">
  import SEO from "$lib/components/Shared/SEO/SEO.svelte"
  import { RoomListing } from "$lib/components/Room"
</script>

<SEO prependTitle="ADMIN" />

<RoomListing isOwnRoomListing={true} />
