import type { Db } from '@pagmanager/db';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app.js';
import {
  closeTestApp,
  createTestApp,
  type TestApp,
} from '../helpers/testApp.js';

describe('health route', () => {
  let testApp: TestApp;
  let db: Db;
  let app: ReturnType<typeof createApp>;
  let env: TestApp['env'];

  beforeAll(async () => {
    testApp = await createTestApp();
    ({ db, app, env } = testApp);
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it.each(['/health', '/api/v1/health'])(
    'is unauthenticated at %s and does a real DB round-trip',
    async (path) => {
      const res = await app.request(path);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'ok' });
    },
  );

  it.each(['/health', '/api/v1/health'])(
    'returns 503 at %s when the DB round-trip fails',
    async (path) => {
      const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
      const brokenApp = createApp({
        db: {
          ...db,
          client: {
            execute: () => {
              throw new Error(
                'postgres://user:db-secret@database.internal:5432/paymanager',
              );
            },
          },
        } as unknown as Db,
        env: { ...env, nodeEnv: 'production' },
      });

      try {
        const res = await brokenApp.request(path);
        expect(res.status).toBe(503);
        expect(await res.json()).toEqual({ status: 'error' });
        const logged = errorLog.mock.calls.flat().join(' ');
        expect(logged).toContain('health_check_failed');
        expect(logged).not.toContain('db-secret');
        expect(logged).not.toContain('database.internal');
      } finally {
        errorLog.mockRestore();
      }
    },
  );
});
