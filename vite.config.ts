import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    watch: {
      usePolling: true,
    },
  },
  define: {
    global: 'globalThis',
  },
  root: '.',
  base: '/homestation/',
  build: {
    target: 'es2017', // Target ES2017 - transpiles ES2020+ features like optional chaining for older browsers (Raspberry Pi 4)
  },
})
