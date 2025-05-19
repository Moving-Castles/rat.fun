<script lang="ts">
	import { onMount } from 'svelte';
	import { ENVIRONMENT } from '@mud/enums';
	import { getUIState } from '@modules/ui/state.svelte';
</script>

<style lang="scss">
	// Base layout structure (from original .main class)
	// This is used by .door-content-wrapper
	%main-layout-structure {
		height: 100%;
		width: 100%;
		overflow: hidden;
		display: grid;
		grid-template-rows: var(--header-height, 60px) 1fr;
	}

	.door-content-wrapper {
		@extend %main-layout-structure;
		position: absolute; // Fill the .left-door or .right-door parent
		top: 0;
		left: 0;
		background: transparent; // The content *inside* provides the visuals
		border: none; // Assuming border is on .layer-game or not part of split content
	}

	.layer-game {
		position: fixed;
		top: 0;
		left: 0;
		height: var(--game-window-height);
		width: var(--game-window-width);
		z-index: 10;
		border: var(--default-border-style); // Overall game window border
		overflow: hidden; // Clip any door overflow if they animate beyond bounds
		// Though with translateX(+-50%) they shouldn't.
	}

	.door-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.left-door,
	.right-door {
		position: absolute;
		top: 0;
		width: 100%; // Each "door" is full width, containing a full-width layout
		height: 100%;
		overflow: hidden; // Essential for clip-path to work on content
		background: transparent; // Door surface is clear; its content is what's seen & clipped
	}

	.left-door {
		left: 0;
		clip-path: inset(0 50% 0 0); // Shows the left 50% of its content
	}

	.right-door {
		// Symmetrical positioning for its clip-path.
		// If using `right:0;` ensure transforms are intuitive. `left:0;` might be simpler.
		left: 0;
		clip-path: inset(0 0 0 50%); // Shows the right 50% of its content
	}

	// .main-area and its columns define the layout within the 1fr part of .door-content-wrapper
	.main-area {
		// This is the second row of the .door-content-wrapper grid
		// No explicit grid-row needed if it's the only 1fr consumer after header
		width: 100%;
		height: var(--game-window-height); // Fill its allocated space in the parent grid
		display: grid;
		grid-template-columns: calc(var(--game-window-width) * 0.44) 1fr calc(
				var(--game-window-width) * 0.44
			);
	}

	.main-area-left-column,
	.main-area-center-column,
	.main-area-right-column {
		overflow: hidden; // Prevent content spill from columns
		// Add any other necessary styling for these columns
	}

	// Other styles like .dust, .layer-below, .routing remain as you had them.
	.dust {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 1000;
		pointer-events: none;
		background-image: url(/images/dust.png);
		opacity: 0.6;
		background-size: cover;
	}

	.layer-below {
		z-index: 0;
	}

	.routing {
		position: fixed;
		bottom: 0;
		right: 0;
		z-index: 9999; // Highest for debug
		background: #030;
		color: grey;
		width: 400px;
		padding: 10px;
	}
</style>
