import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: '/uziprep/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' },
          },
        ],
      },
      manifest: {
        name: 'UziPrep — аккредитация УЗИ',
        short_name: 'UziPrep',
        description: 'Подготовка к аккредитации по УЗИ: станции, чек-листы, экзамен',
        theme_color: '#0F6E56',
        background_color: '#FBFBF6',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
