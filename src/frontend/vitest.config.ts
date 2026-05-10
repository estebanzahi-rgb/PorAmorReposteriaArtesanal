import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', '.next', 'e2e', '**/*.config.*'],
    },
  },
  resolve: {
    alias: {
      '@lib': resolve(__dirname, './lib'),
      '@components': resolve(__dirname, './components'),
      '@types-app': resolve(__dirname, './types'),
    },
  },
});
