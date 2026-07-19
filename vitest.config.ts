import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node', // тесты только на чистую логику, DOM не нужен
    setupFiles: ['./src/lib/__tests__/setup.ts'],
    include: ['src/**/*.test.ts'],
  },
});
