import devtoolsJson from "vite-plugin-devtools-json"
import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"
import { readFileSync } from "fs"
import { visualizer } from "rollup-plugin-visualizer"
import { enhancedImages } from "@sveltejs/enhanced-img"

export default defineConfig(() => {
  const analyze = process.env.ANALYZE === "true"

  return {
    plugins: [
      enhancedImages(),
      sveltekit(),
      devtoolsJson(),
      {
        name: "glsl-loader",
        transform(_code: string, id: string) {
          if (id.endsWith(".glsl")) {
            const source = readFileSync(id, "utf-8")
            return {
              code: `export default ${JSON.stringify(source)};`,
              map: null
            }
          }
        }
      },
      analyze &&
        visualizer({
          filename: "bundle-stats.html",
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: "treemap"
        })
    ].filter(Boolean)
  }
})
