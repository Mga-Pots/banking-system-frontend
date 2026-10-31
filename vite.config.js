/* global process */
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vercel sets VERCEL=1 during its builds. Locally this check is skipped.
  if (process.env.VERCEL === '1') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const apiUrl = env.VITE_API_URL ?? ''

    if (!apiUrl.startsWith('https://')) {
      throw new Error(
        'VITE_API_URL must be the https:// backend URL ending in /api. Set it in Vercel → Settings → Environment Variables.',
      )
    }
    if (env.VITE_USE_MOCK === 'true') {
      throw new Error('VITE_USE_MOCK is "true". Mocks must be off on Vercel. Set it to "false" or remove it.')
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      sourcemap: false,
    },
  }
})
