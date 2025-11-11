import { defineConfig } from "tsup"

export default defineConfig(opts => ({
  entry: ["src/exports/index.ts", "src/exports/internal.ts", "src/bin/deploy.ts"],
  outDir: "dist/tsup",
  format: ["esm"],
  dts: false, // Disabled due to React version conflicts - will fix later
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  treeshake: true,
  target: "es2022",
  external: ["react", "react-dom", "viem", "wagmi", "@tanstack/react-query"],
  // Because we're injecting CSS via shadow DOM, we'll disable style injection and load CSS as a base64 string.
  injectStyle: false,
  loader: { ".css": "text" },
  esbuildOptions(options) {
    options.jsx = "automatic"
  }
}))
