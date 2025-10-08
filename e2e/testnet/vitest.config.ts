import { defineConfig } from "vitest/config"

export default defineConfig({
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
