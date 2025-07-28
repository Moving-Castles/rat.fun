<script lang="ts">
	import { RoomSEO } from '$lib/components/Room';
	let { data } = $props();
</script>

<RoomSEO room={data.room} />

{data.room.prompt}
