// import adapter from '@sveltejs/adapter-auto';
import adapter from "@sveltejs/adapter-static"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: "index.html",
      precompress: false,
      strict: false
    }),
    alias: {
      contracts: "../contracts",
      "@server/*": "../server/src/*",
      "@websocket-server/*": "../websocket-server/src/*",
      "@sanity-types": "../cms-public/sanity.types"
    }
  }
}

export default config
