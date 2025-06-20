import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), devtoolsJson()],
	define: {
		// Fix for RAINBOW_PROVIDER_API_KEY error
    	// https://github.com/rainbow-me/rainbowkit/discussions/2003
		'process.env.RAINBOW_PROVIDER_API_KEY': JSON.stringify('')
	}
});
