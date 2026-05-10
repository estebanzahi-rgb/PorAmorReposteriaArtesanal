import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', 'prisma', '**/*.module.ts', '**/main.ts'],
    },
  },
  plugins: [swc.vite()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, './src/shared'),
      '@auth': resolve(__dirname, './src/auth'),
      '@catalog': resolve(__dirname, './src/catalog'),
      '@cart': resolve(__dirname, './src/cart'),
      '@order': resolve(__dirname, './src/order'),
      '@payment': resolve(__dirname, './src/payment'),
      '@notification': resolve(__dirname, './src/notification'),
      '@discount': resolve(__dirname, './src/discount'),
    },
  },
});
