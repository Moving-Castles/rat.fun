import { defineConfig } from "tsup"

export default defineConfig(() => ({
  target: "esnext",
  format: ["esm"],
  sourcemap: true,
  dts: true,
  clean: true,
  entry: {
    "mud.config": "mud.config.ts",
    enums: "enums.ts",
    worldAbi: "worldAbi.ts",
    externalAbis: "externalAbis.ts"
  }
}))
