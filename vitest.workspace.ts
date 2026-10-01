// Vitest 5 uses test.projects instead of auto-discovering workspace files.
// Keep the workspace manifest here and load it from vitest.config.ts.
export default [
  './packages/contracts/vitest.config.ts',
  './packages/db/vitest.config.ts',
  './apps/api/vitest.config.ts',
  './apps/web/vitest.config.ts',
];
