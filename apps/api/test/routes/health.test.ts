import type { Db } from '@pagmanager/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { closeTestApp, createTestApp, type TestApp } from '../helpers/testApp.js';

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

  it('is unauthenticated and does a real DB round-trip', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('returns 503 with an error message when the DB round-trip fails', async () => {
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

    const res = await brokenApp.request('/health');
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.message).toContain('connection refused');
  });
});
