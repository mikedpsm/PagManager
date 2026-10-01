import { fileURLToPath } from 'node:url';

import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    test: {
      name: 'web',
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
      clearMocks: true,
      include: ['src/**/*.test.{ts,tsx}'],
      isolate: true,
      testTimeout: 15_000,
      sequence: { groupOrder: 0 },
    },
  }),
);
