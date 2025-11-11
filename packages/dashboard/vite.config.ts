import devtoolsJson from "vite-plugin-devtools-json"
import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"

export default defineConfig(() => {
  return {
    server: {
      port: 2475
    },
    plugins: [sveltekit(), devtoolsJson()]
  }
})
