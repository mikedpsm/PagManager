import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  platform: 'node',
  outDir: process.env.API_DIST_DIR ?? 'dist',
  clean: true,
  dts: false,
  outExtensions: () => ({ js: '.mjs' }),
});
