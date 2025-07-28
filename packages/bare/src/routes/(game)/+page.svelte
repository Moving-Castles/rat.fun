<script lang="ts">
	let { data } = $props();
</script>

{#each data.rooms as room, i}
	<a href="/{room._id}">
		Room #{i + 1}
	</a>
{/each}
