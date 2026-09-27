import type { Db } from '@pagmanager/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
      const brokenApp = createApp({
        db: {
          ...db,
          client: {
            execute: () => {
              throw new Error('connection refused');
            },
          },
        } as unknown as Db,
        env,
      });

      const res = await brokenApp.request(path);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.status).toBe('error');
      expect(body.message).toContain('connection refused');
    },
  );
});
