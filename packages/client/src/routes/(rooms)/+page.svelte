<script lang="ts">
  import { fly } from "svelte/transition"
  import SEO from "$lib/components/Kit/SEO.svelte"
  import RoomListing from "$lib/components/Main/Shared/RoomListing/RoomListing.svelte"
</script>

<SEO prependTitle="ROOMS" />

<RoomListing isOwnRoomListing={false} />
