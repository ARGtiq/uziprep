import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: '/uziprep/', // подставь реальное имя репозитория; для username.github.io (корневой репо) — base не нужен, или '/'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // тихое автообновление в фоне — баннер подтверждения убран (не работал стабильно), версия в Профиле + ручная кнопка сброса кэша остаются как проверка/аварийный вариант
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Сонограммы (public/sonograms/) намеренно НЕ в принудительном
        // precache — это ~11 МБ дополнительных картинок, не все из
        // которых человек вообще откроет. Форсировать их загрузку при
        // каждой установке/обновлении приложения — плохой UX на
        // мобильном интернете. Вместо этого runtime-кэширование ниже:
        // подгружаются и кэшируются лениво, при первом реальном
        // просмотре конкретной картинки.
        globIgnores: ['sonograms/**'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/sonograms/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sonograms-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
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
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
