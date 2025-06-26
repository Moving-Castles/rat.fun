<script lang="ts">
  import { fly } from "svelte/transition"
  import SEO from "$lib/components/Kit/SEO.svelte"
  import RoomListing from "$lib/components/Main/Shared/RoomListing/RoomListing.svelte"
  import CenterBar from "$lib/components/Main/CenterBar/CenterBar.svelte"
  import RatContainer from "$lib/components/Main/RatContainer/RatContainer.svelte"
</script>

<SEO prependTitle="ROOMS" />

<!-- Grid position 1  -->
<RatContainer />
<!-- Grid position 2 -->
<CenterBar />
<!-- Grid position 3 -->

<RoomListing isOwnRoomListing={false} />
