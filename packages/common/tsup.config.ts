import { defineConfig } from "tsup"

export default defineConfig(() => ({
  target: "esnext",
  format: ["esm"],
  sourcemap: true,
  dts: true,
  clean: true,
  entry: {
    "basic-network": "./src/basic-network/index.ts",
    "erc20": "./src/erc20/index.ts",
    "error-handling": "./src/error-handling/index.ts",
    "mud": "./src/mud/index.ts",
    "mud/world": "./src/mud/world.ts"
  },
}))
