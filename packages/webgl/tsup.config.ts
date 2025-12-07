import { defineConfig } from "tsup"
import { readFileSync } from "fs"
import type { Plugin } from "esbuild"

// Plugin to import .glsl files as strings
const glslPlugin: Plugin = {
  name: "glsl",
  setup(build) {
    build.onLoad({ filter: /\.glsl$/ }, async args => {
      const source = readFileSync(args.path, "utf8")
      return {
        contents: `export default ${JSON.stringify(source)}`,
        loader: "js"
      }
    })
  }
}

export default defineConfig(() => ({
  target: "esnext",
  format: ["esm"],
  sourcemap: true,
  dts: true,
  clean: true,
  esbuildPlugins: [glslPlugin],
  entry: {
    index: "./src/index.ts",
    "shaders/index": "./src/shaders/index.ts",
    "shaders/black/index": "./src/shaders/black/index.ts",
    "shaders/clouds/index": "./src/shaders/clouds/index.ts",
    "shaders/clouds-bw/index": "./src/shaders/clouds-bw/index.ts",
    "shaders/magic/index": "./src/shaders/magic/index.ts",
    "shaders/plasma/index": "./src/shaders/plasma/index.ts",
    "shaders/plasma-lamp/index": "./src/shaders/plasma-lamp/index.ts",
    "shaders/plasma-optimized/index": "./src/shaders/plasma-optimized/index.ts",
    "shaders/plasma-optimized-green/index": "./src/shaders/plasma-optimized-green/index.ts",
    "shaders/starfield/index": "./src/shaders/starfield/index.ts",
    "shaders/swirly-noise/index": "./src/shaders/swirly-noise/index.ts",
    "shaders/trip-processing/index": "./src/shaders/trip-processing/index.ts",
    "shaders/vortex/index": "./src/shaders/vortex/index.ts"
  }
}))
