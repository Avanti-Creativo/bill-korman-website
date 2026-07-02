import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      FUNNEL_SESSION_SECRET: 'test-secret-vitest',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
