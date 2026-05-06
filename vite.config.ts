import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  // ── Inline PostCSS — works with all Vite versions ──────────────────
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: './tailwind.config.js' }),
        autoprefixer(),
      ],
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})