import devtoolsJson from "vite-plugin-devtools-json"
import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"
import { readFileSync } from "fs"

export default defineConfig(() => {
  return {
    plugins: [
      sveltekit(),
      // devtoolsJson(),
      // {
      //   name: "glsl-loader",
      //   transform(code, id) {
      //     if (id.endsWith(".glsl")) {
      //       const source = readFileSync(id, "utf-8")
      //       return {
      //         code: `export default ${JSON.stringify(source)};`,
      //         map: null
      //       }
      //     }
      //   }
      // }
    ],
    ssr: {
          external: [
      'fsevents', 
      'chokidar',
      // Add other Node.js specific packages if needed
      ],
      noExternal: [
        "@latticexyz/common",
        "@latticexyz/dev",
        "@latticexyz/entrykit",
        "@latticexyz/recs",
        "@latticexyz/schema",
        "@latticexyz/store",
        "@latticexyz/utils",
        "@latticexyz/world",
        "@sentry/sveltekit",
        "viem"
      ]
    }
  }
})

