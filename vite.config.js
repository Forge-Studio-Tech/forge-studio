import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      devOptions: { enabled: false },
      includeAssets: ['favicon.ico', 'logo-192.png', 'logo-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Forge Studio — Mission Control',
        short_name: 'Forge MC',
        description: 'Portal de gestão da Forge Studio',
        lang: 'pt-BR',
        theme_color: '#0c0a09',
        background_color: '#0c0a09',
        display: 'standalone',
        orientation: 'any',
        start_url: '/portal',
        scope: '/',
        icons: [
          { src: '/logo-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        globIgnores: ['cases/**', '**/*.png'],
      },
    }),
  ],
  base: '/',
})
