import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const wranglerPort = process.env.WRANGLER_PORT || '8787'

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/agent': {
        target: `http://localhost:${wranglerPort}`,
        changeOrigin: true,
      },
    },
  },
})
