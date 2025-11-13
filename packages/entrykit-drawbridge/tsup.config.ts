import { defineConfig, type Options } from "tsup"

const config: Options = {
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm"],
  dts: false, // Disabled: complex viem types cause issues, using source types instead
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  treeshake: true,
  target: "es2022",
  external: ["viem"]
}

export default defineConfig(() => config)
