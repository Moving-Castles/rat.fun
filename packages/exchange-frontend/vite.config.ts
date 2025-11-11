import devtoolsJson from "vite-plugin-devtools-json"
import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"
import { readFileSync } from "fs"

export default defineConfig(() => {
  return {
    server: {
      port: 3475
    },
    plugins: [
      sveltekit(),
      devtoolsJson(),
      {
        name: "glsl-loader",
        transform(code, id) {
          if (id.endsWith(".glsl")) {
            const source = readFileSync(id, "utf-8")
            return {
              code: `export default ${JSON.stringify(source)};`,
              map: null
            }
          }
        }
      }
    ]
    // Uncomment when linking local entrykit to fix issues with multiple react instances
    /*
    resolve: {
      alias: {
        'react-dom': path.resolve('./node_modules/react-dom'),
        'react': path.resolve('./node_modules/react')
      }
    },
    */
  }
})
