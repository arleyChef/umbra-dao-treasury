import path from 'path'
import { fileURLToPath } from 'url'
const __ewDir = path.dirname(fileURLToPath(import.meta.url))
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'events', 'path', 'os'],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  optimizeDeps: {
    include: ['@umbra-privacy/sdk', '@umbra-privacy/web-zk-prover'],
    esbuildOptions: {
      target: 'esnext',
      define: { global: 'globalThis' },
    },
  },
  build: {
    target: 'esnext',
    commonjsOptions: { transformMixedEsModules: true },
  },
  server: {
    cors: true,
    allowedHosts: true,
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
})
