<script lang="ts">
	import { RoomSEO } from '$lib/components/Room';
	let { data } = $props();
</script>

<RoomSEO room={data.room} />

{data.room.prompt}

{#each data.roomOutcomes as outcome, i}
	<a href="/{data.room._id}/{outcome._id}">
		Outcome #{i}
	</a>
{/each}
