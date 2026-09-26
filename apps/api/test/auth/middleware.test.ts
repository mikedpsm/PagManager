import {
  createInMemoryDb,
  type Db,
  runMigrations,
  users,
} from '@pagmanager/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { signAuthToken } from '../../src/auth/jwt.js';
import { authMiddleware } from '../../src/auth/middleware.js';
import { registerErrorHandler } from '../../src/error-handler.js';
import type { AppDeps, AppEnv } from '../../src/types.js';

const JWT_SECRET = 'test-secret';

describe('authMiddleware', () => {
  let db: Db;
  let userId: string;

  beforeAll(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    const [inserted] = await db.client
      .insert(users)
      .values({
        username: 'Test User',
        email: 'test-user@example.com',
        passwordHash: 'pbkdf2$600000$salt$hash',
      })
      .returning({ id: users.id });
    if (!inserted) {
      throw new Error('Failed to create test user');
    }
    userId = inserted.id;
  });

  afterAll(async () => {
    await db.close();
  });

  function buildApp() {
    const deps: AppDeps = {
      db,
      env: {
        nodeEnv: 'test',
        port: 5000,
        databaseUrl: undefined,
        dataDir: './data',
        jwtSecret: JWT_SECRET,
        corsOrigin: undefined,
      },
    };

    const app = new Hono<AppEnv>();
    app.use('*', authMiddleware(deps));
    app.get('/protected', (c) => c.json({ user: c.get('user') }));
    registerErrorHandler(app);
    return app;
  }

  it('returns 401 when the Authorization header is missing', async () => {
    const app = buildApp();
    const res = await app.request('/protected');
    expect(res.status).toBe(401);
  });

  it('returns 401 when the Authorization header is malformed', async () => {
    const app = buildApp();
    const res = await app.request('/protected', {
      headers: { Authorization: 'Token abc123' },
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid/expired token', async () => {
    const app = buildApp();
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer not-a-real-token' },
    });
    expect(res.status).toBe(401);
  });

  it('loads the user and exposes it via c.get("user") for a valid token, never leaking the password hash', async () => {
    const app = buildApp();
    const token = await signAuthToken(userId, JWT_SECRET);
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.id).toBe(userId);
    expect(body.user.email).toBe('test-user@example.com');
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    expect(JSON.stringify(body)).not.toContain('pbkdf2$600000$salt$hash');
  });
});
