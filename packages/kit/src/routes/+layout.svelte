<script lang="ts">
	import { onMount } from 'svelte';
	import { ENVIRONMENT } from '@mud/enums';
	import { getUIState } from '@modules/ui/state.svelte';
	import { UIState, UILocation } from '@modules/ui/stores';
	import { UI, LOCATION } from '@modules/ui/enums';
	import { initOffChainSync } from '@modules/off-chain-sync';
	import { playerId } from '@modules/state/base/stores';
	import { websocketConnected } from '@modules/off-chain-sync/stores';
	import { publicNetwork } from '@modules/network';
	import { FullStory, init as initFullstory } from '@fullstory/browser';
	import { EMPTY_CONNECTION } from '@modules/utils/constants';
	import { SvelteURL } from 'svelte/reactivity';

	// Tippy CSS
	import 'tippy.js/dist/tippy.css';

	// import { Modal } from '@components/Main/Modal/state.svelte';
	// import Loading from '@components/Loading/Loading.svelte';
	// import Main from '@components/Main/Main.svelte';
	// import Spawn from '@components/Spawn/Spawn.svelte';

	let { environment, children }: { environment: ENVIRONMENT; children: any } = $props();

	const url = new SvelteURL(window.location.href);
	let hash = $derived(url.hash.replace('#', ''));

	const environmentLoaded = () => {
		UIState.set(UI.SPAWNING);
	};

	const { rooms } = getUIState();

	const playerSpawned = () => {
		UIState.set(UI.READY);
		UILocation.set(LOCATION.MAIN);
	};

	// Init of chain sync when player is ready
	$effect(() => {
		if ($playerId && $playerId !== EMPTY_CONNECTION && !$websocketConnected) {
			console.log('Initializing off-chain sync');
			initOffChainSync(environment, $playerId);

			// Fullstory analytics
			initFullstory({
				orgId: 'o-1RP0ZA-na1',
				debug: true
			});

			FullStory('setIdentity', {
				uid: $playerId,
				properties: {
					displayName: $playerId
				}
			});
		}
	});
</script>

{@render children?.()}
