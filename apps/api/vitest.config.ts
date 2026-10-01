import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    name: 'api',
    environment: 'node',
    include: ['test/**/*.test.ts'],
    isolate: true,
    maxWorkers: 2,
    hookTimeout: 30_000,
    sequence: { groupOrder: 2 },
  },
});
