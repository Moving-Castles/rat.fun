<script lang="ts">
  import SEO from "$lib/components/Kit/SEO.svelte"
  import RoomListing from "$lib/components/Main/Shared/RoomListing/RoomListing.svelte"
  import CenterBar from "$lib/components/Main/CenterBar/CenterBar.svelte"
  import RoomContainer from "$lib/components/Main/RoomContainer/RoomContainer.svelte"
</script>

<SEO prependTitle="LANDLORD" />

<!-- Grid position 1  -->
<RoomContainer />
<!-- <RatContainer /> -->
<!-- Grid position 2 -->
<CenterBar />
<!-- Grid position 3 -->
<RoomListing isOwnRoomListing={true} />
