import { createInMemoryDb, runMigrations, type Db } from '@pagmanager/db';

import { createApp } from '../../src/app.js';
import type { AppConfig } from '../../src/env.js';

/**
 * Shared setup used across every route test file: an in-memory PGlite `Db`
 * with migrations applied, a matching `AppConfig`, and the resulting Hono
 * `app`. Extracted here to avoid re-declaring the same
 * `createInMemoryDb + runMigrations + createApp` boilerplate in every
 * `test/routes/*.test.ts` file.
 */
export function testEnv(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    nodeEnv: 'test',
    port: 5000,
    databaseUrl: undefined,
    dataDir: './data',
    jwtSecret: 'test-secret',
    corsOrigin: undefined,
    ...overrides,
  };
}

export interface TestApp {
  db: Db;
  app: ReturnType<typeof createApp>;
  env: AppConfig;
}

export async function createTestApp(
  overrides: Partial<AppConfig> = {},
): Promise<TestApp> {
  const db = createInMemoryDb();
  await runMigrations(db);
  const env = testEnv(overrides);
  const app = createApp({ db, env });
  return { db, app, env };
}

export async function closeTestApp(testApp: TestApp): Promise<void> {
  await testApp.db.close();
}

/**
 * Registers a new user via `POST /api/v1/auth/register` and returns the
 * bearer token. Kept separate from `authedRequest` so callers can register
 * as many users as they need before building per-user request helpers.
 */
export async function registerUser(
  app: ReturnType<typeof createApp>,
  options: { email: string; username?: string; passwd?: string },
): Promise<{ token: string; user: Record<string, unknown> }> {
  const res = await app.request('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: options.username ?? 'User',
      email: options.email,
      passwd: options.passwd ?? 'supersecret',
    }),
  });
  const body = await res.json();
  return { token: body.token as string, user: body.user };
}

/**
 * Returns a `request(path, init)` function that automatically attaches the
 * given bearer token and a JSON content-type header.
 */
export function authedRequest(app: ReturnType<typeof createApp>, token: string) {
  return (path: string, init: RequestInit = {}) =>
    app.request(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
}
