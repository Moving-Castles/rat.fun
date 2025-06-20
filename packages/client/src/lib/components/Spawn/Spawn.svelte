<script lang="ts">
	import type { AccountKitConnectReturn } from './account-kit-connect/types';
	import { WALLET_TYPE } from '$lib/mud/enums';
	import { onMount } from 'svelte';
	import { ENTITY_TYPE } from 'contracts/enums';
	import { spawn } from '$lib/modules/action';
	import { waitForCompletion } from '$lib/modules/action/actionSequencer/utils';
	import { playSound } from '$lib/modules/sound';
	import { player, playerAddress } from '$lib/modules/state/base/stores';
	import { connect } from './account-kit-connect';
	import { walletNetwork } from '$lib/modules/network';
	import { publicNetwork } from '$lib/modules/network';
	import { setupWalletNetwork } from '$lib/mud/setupWalletNetwork';
	import { setupBurnerWalletNetwork } from '$lib/mud/setupBurnerWalletNetwork';
	import { initActionSequencer } from '$lib/modules/action/actionSequencer';
	import { initErc20Listener } from '$lib/modules/state/base/erc20Listener';
	import { store as accountKitStore } from '@latticexyz/account-kit/bundle';
	import { SPAWN_STATE } from '$lib/modules/ui/enums';

	import Slides from '$lib/components/Main/Shared/Slides/Slides.svelte';
	import VideoLoader from '$lib/components/Main/Shared/VideoLoader/VideoLoader.svelte';
	import BigButton from '$lib/components/Main/Shared/Buttons/BigButton.svelte';

	const { walletType, spawned = () => {} } = $props<{
		walletType: WALLET_TYPE;
		spawned: () => void;
	}>();

	let currentState = $state<SPAWN_STATE>(SPAWN_STATE.INTRODUCTION);
	let name = $state('');

	async function sendSpawn() {
		if (!name) {
			return;
		}

		playSound('tcm', 'blink');
		currentState = SPAWN_STATE.BUSY;

		try {
			const spawnAction = spawn(name);
			await waitForCompletion(spawnAction);
			spawned();
		} catch (e) {
			console.error(e);
			currentState = SPAWN_STATE.SHOW_FORM;
		}
	}

	async function connectAccountKit() {
		let accountKitConnectReturn: AccountKitConnectReturn | null = null;
		console.log('connectWallet');
		console.log('accountKitConnectReturn', accountKitConnectReturn);

		while (!accountKitConnectReturn) {
			try {
				accountKitConnectReturn = await connect();
			} catch (e) {
				console.log('Account kit error', e);
			}
		}

		console.log('accountKitConnectReturn', accountKitConnectReturn);

		// walletNetwork.set(setupBurnerWalletNetwork(get(publicNetwork)))
		walletNetwork.set(setupWalletNetwork($publicNetwork, accountKitConnectReturn.appAccountClient));

		// Set player address to main wallet address
		playerAddress.set(accountKitConnectReturn.userAddress);

		// console.log('walletNetwork', $walletNetwork);
		// console.log('publicNetwork', $publicNetwork);
		console.log('playerAddress', $playerAddress);

		// Modules responsible for sending transactions
		initActionSequencer();
		initErc20Listener();

		// Transition to show form
		currentState = SPAWN_STATE.SHOW_FORM;
	}

	async function connectBurner() {
		console.log('connectBurner');
		walletNetwork.set(setupBurnerWalletNetwork($publicNetwork));
		playerAddress.set($walletNetwork.walletClient?.account.address);
		initActionSequencer();
		initErc20Listener();

		// Transition to show form
		currentState = SPAWN_STATE.SHOW_FORM;
	}

	onMount(() => {
		if (walletType == WALLET_TYPE.ACCOUNTKIT) {
			/* We get the account kit store state
			 * If appAccountClient and userAddress are set the user is connected
			 * We set up the wallet network using the appAccountClient
			 * and set playerAddress to the user address
			 */
			const accountKitStoreState = accountKitStore.getState();
			console.log('accountKitStoreState', accountKitStoreState);

			if (accountKitStoreState.appAccountClient && accountKitStoreState.userAddress) {
				// Wallet is connected
				walletNetwork.set(
					setupWalletNetwork($publicNetwork, accountKitStoreState.appAccountClient)
				);
				// Set player address to main wallet address
				playerAddress.set(accountKitStoreState.userAddress);

				// Check if player is already spawned
				if ($player?.entityType === ENTITY_TYPE.PLAYER) {
					// Connected and spawned - go to next step
					initErc20Listener();
					spawned();
				} else {
					// Connected but not spawned - show form
					currentState = SPAWN_STATE.SHOW_FORM;
				}
			} else {
				// Wallet not connected - show connect wallet state
				currentState = SPAWN_STATE.CONNECT_WALLET;
			}
		} else {
			console.log('is burner');
			// For burner wallet, connect immediately
			connectBurner();

			// Check if player is already spawned
			if ($player?.entityType === ENTITY_TYPE.PLAYER) {
				// Connected and spawned - go to next step
				initErc20Listener();
				spawned();
			} else {
				// Connected but not spawned - show form
				currentState = SPAWN_STATE.SHOW_FORM;
			}
		}
	});
</script>

<div class="container">
	{#if currentState === SPAWN_STATE.INTRODUCTION}
		<Slides onComplete={() => (currentState = SPAWN_STATE.CONNECT_WALLET)} />
	{:else if currentState === SPAWN_STATE.CONNECT_WALLET}
		<div class="main">
			<div class="content">
				<div class="form">
					<p>Connect your wallet</p>
					<BigButton text="CONNECT" onclick={connectAccountKit} />
				</div>
			</div>
		</div>
	{:else if currentState === SPAWN_STATE.SHOW_FORM}
		<div class="main">
			<!-- INTRO TEXT -->
			<div class="content">
				<p class="header">
					<span class="inverted">Welcome to Rat Rooms Playtest #5</span>
				</p>
				<p class="small">
					You are an Operator working for the Firm. Your objective is to regain access to the
					underground floors of Facility F which has gone rogue. Use a remote controlled Rat to
					enter the facility by sending it down the (rat-sized) elevator to explore its many rooms,
					collecting items, traits and currency on your rat.
				</p>
				<ol class="small">
					<li>Study the rooms</li>
					<li>Send in your rat</li>
					<li>Traits, tokens, and items are useful in rooms</li>
					<li>Liquidate your rat to cash out</li>
					<li>Create your own rooms</li>
				</ol>
			</div>

			<!-- FORM -->
			<div class="form">
				<p>Sign with operator name to proceed.</p>
				<!-- INPUT -->
				<input
					type="text"
					placeholder="YOUR NAME"
					bind:value={name}
					onkeydown={(e) => e.key === 'Enter' && sendSpawn()}
				/>
				<BigButton text="SIGN" onclick={sendSpawn} disabled={!name} />
			</div>
		</div>
	{:else if currentState === SPAWN_STATE.BUSY}
		<VideoLoader duration={6000} />
	{/if}
</div>

<style lang="scss">
	.container {
		width: 100vw;
		height: 100vh;
		background: var(--background);
		color: var(--foreground);
		font-family: var(--special-font-stack);
		text-transform: none;
		font-size: var(--font-size-large);
	}

	.main {
		width: 100%;
		height: 100%;
		max-width: calc(var(--game-window-width) * 0.9);
		padding: 10px 30px;
		padding-bottom: 30px;
		max-width: 60ch;
	}

	p {
		margin-bottom: 1em;
	}

	.inverted {
		background: var(--color-alert-priority);
		color: var(--background);
		padding: 5px;
	}

	.header {
		margin-bottom: 2em;
		display: block;
	}

	.content {
		padding-top: 1em;
		padding-bottom: 1em;
		border-bottom: 1px dashed var(--foreground);
		margin-bottom: 1em;
	}

	input {
		height: 4em;
		width: 300px;
		font-size: 18px;
		padding: 10px;
		background: var(--color-alert);
		color: var(--background);
		border: none;
		margin-bottom: 0.5em;
		font-family: 'Rock Salt', cursive;
		text-transform: uppercase;
		border-bottom: var(--default-border-style);
		outline: none;

		&::placeholder {
			color: var(--color-grey-dark);
		}
	}
</style>
