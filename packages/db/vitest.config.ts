import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    name: 'db',
    environment: 'node',
    include: ['test/**/*.test.ts'],
    isolate: true,
    fileParallelism: false,
    hookTimeout: 30_000,
    sequence: { groupOrder: 1 },
  },
});
