<script lang="ts">
	// Outcome logs
	import { Outcome } from '$lib/components/Room';

	let { data } = $props();
</script>

<Outcome outcome={data.outcome} />
