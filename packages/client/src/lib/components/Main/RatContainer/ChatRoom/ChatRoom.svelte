<script lang="ts">
	import { gameConfig, rat } from '$lib/modules/state/base/stores';
	import { latestEventsOnRatLevel } from '$lib/modules/off-chain-sync/stores';
	import { sendChatMessage } from '$lib/modules/off-chain-sync';
	import { websocketConnected } from '$lib/modules/off-chain-sync/stores';
	import { onMount } from 'svelte';

	import ChatEvent from './ChatEvent.svelte';
	import ChatMessage from './ChatMessage.svelte';
	import ChatHeader from './ChatHeader.svelte';

	let value = $state('');
	let scrollElement = $state<null | HTMLElement>(null);
	let suppressSound = $state(true);

	onMount(() => {
		// Suppress sounds for the first 2 seconds
		setTimeout(() => {
			suppressSound = false;
		}, 2000);
	});

	$effect(() => {
		if ($latestEventsOnRatLevel && scrollElement) {
			scrollElement.scrollTop = scrollElement?.scrollHeight ?? 0;
		}
	});

	const sendMessage = async (e: Event) => {
		e.preventDefault();
		// Limit message length to 500 characters
		if (!value || value.length > 500) return;
		try {
			// Level of the player's rat, or the first level if the rat is not deployed
			const level = $rat?.level ?? $gameConfig?.levelList[0] ?? 'unknown level';
			await sendChatMessage(level, value);
			value = '';
		} catch (e) {
			console.error(e);
		}
	};
</script>

<div class="chat-window">
	<ChatHeader />
	<!-- Chat scroll -->
	<div bind:this={scrollElement} class="chat-scroll">
		{#each $latestEventsOnRatLevel as event (event.id)}
			{#if event.topic == 'chat__message'}
				<ChatMessage {event} {suppressSound} />
			{:else}
				<ChatEvent {event} {suppressSound} />
			{/if}
		{/each}
	</div>
	<!-- Chat input container -->
	<form autocomplete="off" class="chat-input-container" onsubmit={sendMessage}>
		<!-- Chat input -->
		<input bind:value class="chat-input" type="text" name="text" id="text" />
		<!-- Chat submit -->
		<input
			disabled={!$websocketConnected || value === ''}
			class="chat-submit"
			type="submit"
			value="Send"
		/>
	</form>
</div>

<style lang="scss">
	.chat-window {
		height: 100%;
		display: flex;
		overflow: hidden;
		flex-flow: column nowrap;
		position: relative;
		background: url('/images/bg-test.jpg');
		background-size: 100px;
		border-top: var(--default-border-style);

		.chat-scroll {
			// display: flex;
			flex-flow: column nowrap;
			height: 100%;
			// background: red;
			overflow-y: scroll;
			padding: 8px;
			gap: 4px;
		}

		input[disabled] {
			background: var(--color-grey-mid);
		}

		.chat-input-container {
			height: 60px;
			display: flex;
			flex-flow: row nowrap;
			color: var(--foreground);
			bottom: 0;
			z-index: var(--z-high);
			width: 100%;
			padding: 10px;
			position: sticky;
			bottom: 0;

			.chat-submit {
				height: 100%;
				background: var(--color-alert);
				color: var(--white);
				border: var(--default-border-style);
				cursor: pointer;

				&:hover {
					background: var(--background);
				}
			}

			.chat-submit {
				font-family: var(--typewriter-font-stack);
				width: 100px;
				height: 100%;
				color: var(--foreground);
			}

			.chat-input {
				height: 100%;
				width: 100%;
				font-family: var(--typewriter-font-stack);
				color: var(--foreground);
				background-color: var(--color-grey-dark);
				border: var(--dashed-border-style);
				margin-right: 10px;

				&:focus {
					outline: none;
					background: var(--color-grey-light);
					color: var(--background);
				}
			}
		}
	}
</style>
