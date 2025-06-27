<script lang="ts">
  import SEO from "$lib/components/Shared/SEO/SEO.svelte"
  import { RoomListing } from "$lib/components/Shared"
</script>

<SEO prependTitle="LANDLORD" />

<RoomListing isOwnRoomListing={true} />
