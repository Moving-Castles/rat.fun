<script lang="ts">
	import '../app.css';
	import 'tippy.js/dist/tippy.css';

	import type { LayoutProps } from './$types';

	import Loading from '$lib/components/Loading/Loading.svelte';
	import Spawn from '$lib/components/Spawn/Spawn.svelte';
	import PageTransitions from '$lib/components/Main/Shared/PageTransitions/PageTransitions.svelte';
	import { Modal } from '$lib/components/Main/Modal/state.svelte';
	import { onMount } from 'svelte';
	import { initStaticContent } from '$lib/modules/content';
	import { publicNetwork } from '$lib/modules/network';
	import { initSound, playSound } from '$lib/modules/sound';
	import { UIState, UILocation } from '$lib/modules/ui/stores';
	import { UI, LOCATION } from '$lib/modules/ui/enums';
	import { initOffChainSync } from '$lib/modules/off-chain-sync';
	import { playerId } from '$lib/modules/state/base/stores';
	import { websocketConnected } from '$lib/modules/off-chain-sync/stores';
	import { FullStory, init as initFullstory } from '@fullstory/browser';
	import { EMPTY_CONNECTION } from '$lib/modules/utils/constants';
	import WalletInfo from '$lib/components/Debug/WalletInfo.svelte';

	// Account-kit related imports
	import { mount as mountAccountKit } from '@latticexyz/account-kit/bundle';
	import { createConfig, http } from '@wagmi/core';
	import { getNetworkConfig } from '$lib/mud/getNetworkConfig';
	import { supportedChains } from '$lib/mud/supportedChains';
	import { transportObserver } from '@latticexyz/common';
	import { fallback, webSocket } from 'viem';
	import type { Chain } from 'viem';
	import { ENVIRONMENT, WALLET_TYPE } from '$lib/mud/enums';

	let { children, data }: LayoutProps = $props();

	const { environment, walletType } = data;

	const transitionsConfig = [
		{
			from: '/(rooms)/[roomId]',
			to: '/(rooms)/[roomId]/enter',
			out: {
				transition: 'wipe',
				params: {
					duration: 2000,
					direction: 'in'
				}
			},
			in: {
				transition: 'fade',
				params: {
					duration: 1000,
					delay: 200
				}
			}
		},
		{
			from: '/(rooms)/[roomId]/enter',
			to: '*',
			out: {
				transition: 'wipe',
				params: {
					duration: 2000,
					direction: 'in'
				}
			},
			in: {
				transition: 'fade',
				params: {
					duration: 1000,
					delay: 200
				}
			}
		}
	];

	const environmentLoaded = async () => {
		console.log($publicNetwork.worldAddress);
		// Get content from CMS
		await initStaticContent($publicNetwork.worldAddress);
		UIState.set(UI.SPAWNING);
	};

	const playerSpawned = () => {
		UIState.set(UI.READY);
		UILocation.set(LOCATION.MAIN);
	};

	// Init of chain sync when player is ready
	$effect(() => {
		if ($playerId && $playerId !== EMPTY_CONNECTION && !$websocketConnected) {
			console.log('Initializing off-chain sync', environment);
			initOffChainSync(environment, $playerId);
		}
	});

	// Init of chain sync when player is ready
	$effect(() => {
		if ($playerId && $playerId !== EMPTY_CONNECTION && !$websocketConnected) {
			// console.log("Initializing off-chain sync")
			initOffChainSync(data.environment, $playerId);

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

	onMount(async () => {
		// = = = = = = = = = = = =
		// Mount account kit
		// = = = = = = = = = = = =

		if (data.walletType === WALLET_TYPE.ACCOUNTKIT) {
			// Hack to fix:  "Failed to mount MUD Account Kit. ReferenceError: process is not defined"
			window.process = {
				...window.process
			};

			const networkConfig = getNetworkConfig(data.environment);

			// Only include foundry chain in development
			const chains =
				data.environment === ENVIRONMENT.DEVELOPMENT
					? supportedChains
					: supportedChains.filter((c) => c.id !== 31337);

			console.log('chains', chains);
			console.log('networkConfig', networkConfig);

			const wagmiConfig = createConfig({
				chains: chains as readonly [Chain, ...Chain[]],
				pollingInterval: 1_000,
				// TODO: how to properly set up a transport config for all chains supported as bridge sources?
				transports: Object.fromEntries(
					chains.map((chain) => {
						if (chain.rpcUrls.default.webSocket)
							return [chain.id, transportObserver(fallback([webSocket(), http()]))];
						return [chain.id, transportObserver(http())];
					})
				)
			});

			console.log('wagmiConfig', wagmiConfig);
			console.log('mountAccountKit', mountAccountKit);

			mountAccountKit({
				wagmiConfig,
				accountKitConfig: {
					theme: 'dark',
					worldAddress: networkConfig.worldAddress,
					erc4337: false,
					chainId: networkConfig.chainId,
					appInfo: {
						name: 'RAT.FUN'
					}
				}
			});
		}

		// Remove preloader
		document.querySelector('.preloader')?.remove();

		// Preload sounds
		initSound();
		// Play background sound
		playSound('tcm', 'podBg', true, true);
	});
</script>

<div class="bg">
	<div class="context-main">
		{#if $UIState === UI.LOADING}
			<main>
				<Loading {environment} loaded={environmentLoaded} />
			</main>
		{:else if $UIState === UI.SPAWNING}
			<main>
				<Spawn spawned={playerSpawned} {walletType} />
			</main>
		{:else if $UIState === UI.READY}
			<div class="layer-game">
				<PageTransitions config={transitionsConfig}>
					{@render children?.()}
				</PageTransitions>
			</div>
		{/if}
	</div>
</div>

<Modal />

<WalletInfo {walletType} {environment} />

<style lang="scss">
	.context-main {
		width: var(--game-window-width);
		height: var(--game-window-height);
		overflow: hidden;
		position: fixed;
		z-index: var(--z-base);
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		background: var(--background);
	}

	main {
		width: var(--game-window-width);
		height: var(--game-window-height);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.bg {
		position: fixed;
		inset: 0;
		z-index: var(--z-background);
		background: var(--background);
		background-image: url('/images/textures/2.jpg');
		background-size: 300px;
	}
</style>
