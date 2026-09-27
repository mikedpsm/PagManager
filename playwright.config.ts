import { defineConfig } from '@playwright/test';

const baseURL = process.env.PAGMANAGER_E2E_BASE_URL;
if (!baseURL) {
  throw new Error('Run end-to-end tests with `pnpm test:e2e`.');
}

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  outputDir: './test-results',
  use: {
    baseURL,
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer:
    process.platform === 'win32'
      ? undefined
      : {
          command: 'node e2e/server.mjs',
          url: `${baseURL}/health`,
          reuseExistingServer: false,
          timeout: 30_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
});
