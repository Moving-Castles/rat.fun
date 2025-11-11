import { defineConfig } from "tsup"

export default defineConfig(opts => ({
  entry: ["src/index.ts", "src/bin/deploy.ts"],
  outDir: "dist",
  format: ["esm"],
  dts: false, // TODO: Fix type assertions for DTS generation
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  treeshake: true,
  target: "es2022",
  external: ["viem"],
}))
