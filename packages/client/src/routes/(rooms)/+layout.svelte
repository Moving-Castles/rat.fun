<script lang="ts">
	import '../../app.css';
	import 'tippy.js/dist/tippy.css';

	import type { LayoutProps } from './$types';

	import { onMount } from 'svelte';
	import { initSound } from '$lib/modules/sound';

	import Main from '$lib/components/Main/Main.svelte';

	let { children, data }: LayoutProps = $props();

	const { environment } = data;

	onMount(async () => {
		// Remove preloader
		document.querySelector('.preloader')?.remove();

		// Preload sounds
		initSound();
	});
</script>

<div class="main-area">
	<Main {environment}>
		{@render children?.()}
	</Main>
</div>

<style lang="scss">
	.main-area {
		width: 100%;
		height: var(--game-window-height);
		display: grid;
		grid-template-columns: calc(var(--game-window-width) * 0.44) 1fr calc(
				var(--game-window-width) * 0.44
			);
	}
</style>
