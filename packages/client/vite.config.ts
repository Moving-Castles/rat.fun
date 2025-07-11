import devtoolsJson from "vite-plugin-devtools-json"
import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the
  // `VITE_` prefix.
  return {
    plugins: [sveltekit(), devtoolsJson()],
    build: {
      sourcemap: true
    }
  }
})
