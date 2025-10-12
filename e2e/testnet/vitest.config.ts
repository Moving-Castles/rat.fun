import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  resolve: {
    alias: {
      "server/internal": resolve(__dirname, "../../packages/server/src/internal.ts"),
      "@modules": resolve(__dirname, "../../packages/server/src/modules")
    }
  },
  test: {
    environment: "node",
    testTimeout: 1000 * 60 * 10,
    hookTimeout: 1000 * 60 * 10,
    teardownTimeout: 1000,
    maxConcurrency: 1,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
})
