import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "path"

console.log('Resolved @server:', path.resolve(__dirname, '../server/src/'));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@mud': path.resolve(__dirname, './src/mud'),
      '@svelte': path.resolve(__dirname, './src/svelte'),
      '@components': path.resolve(__dirname, './src/svelte/components'),
      '@modules': path.resolve(__dirname, './src/svelte/modules/'),
      '@server': path.resolve(__dirname, '../server/src/'),
      '@sanity-types': path.resolve(__dirname, '../cms-public/sanity.types')
    }
  },
  publicDir: "./src/svelte/public",
  server: {
    port: 3000,
    fs: {
      strict: false,
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
  build: {
    target: "es2022",
    minify: true,
    sourcemap: true,
  },
  define: {
    "process.env": {},
  },
})