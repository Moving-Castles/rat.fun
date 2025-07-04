import devtoolsJson from "vite-plugin-devtools-json"
import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the
  // `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "")
  console.log(JSON.stringify(env, null, 2))
  return {
    plugins: [sveltekit(), devtoolsJson()],
    define: {
      "process.env": {
        RAINBOW_PROVIDER_API_KEY: ""
      }
    },
    build: {
      sourcemap: true
    }
  }
})
